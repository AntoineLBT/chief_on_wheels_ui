import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import api from "@/services/apiClient";
import { db } from "@/services/db";
import { useRestaurantStore } from "@/stores/restaurant";
import { IngredientUnit, OrderStatus } from "@/utils/constant";
import { clearDb } from "@/test/db";

vi.mock("@/services/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function restaurant(pk: string, name: string) {
  return { pk, name, vat_rate: 0, owner: 1 };
}

async function seedRestaurant(pk: string) {
  await db.restaurants.add(restaurant(pk, `Restaurant ${pk}`));
  await db.ingredients.add({
    pk: `${pk}-ingredient`,
    restaurant: pk,
    name: "Tomate",
    unit: IngredientUnit.kg,
    price_per_unit: 4,
    has_extra: false,
    extra_price: null,
    extra_quantity: null,
  });
  await db.recipes.add({
    pk: `${pk}-recipe`,
    restaurant: pk,
    name: "Margherita",
    price: 10,
    is_active: true,
  });
  await db.recipeIngredients.add({
    pk: `${pk}-recipe-ingredient`,
    recipe: `${pk}-recipe`,
    ingredient: `${pk}-ingredient`,
    quantity: 80,
  });
  await db.shifts.add({
    pk: `${pk}-shift`,
    restaurant: pk,
    date: "2026-10-18T10:00:00.000Z",
    ended_at: null,
    vat_rate: 0,
    is_synced: false,
  });
  await db.orders.add({
    pk: `${pk}-order`,
    shift: `${pk}-shift`,
    customer_name: "Jean",
    picking_time: "2026-10-18T12:00:00.000Z",
    status: OrderStatus.todo,
    is_synced: false,
  });
  await db.orderRecipes.add({
    pk: `${pk}-order-recipe`,
    order: `${pk}-order`,
    recipe: `${pk}-recipe`,
    unit_price: 10,
    unit_cost: 0.32,
    is_synced: false,
  });
  await db.orderIngredients.add({
    pk: `${pk}-order-ingredient`,
    order_recipe: `${pk}-order-recipe`,
    ingredient: `${pk}-ingredient`,
    action_type: "ADD",
    extra_price: 0,
    extra_cost: 0,
    is_synced: false,
  });
}

async function localPksOf(restaurantPk: string) {
  const tables = [
    db.restaurants,
    db.ingredients,
    db.recipes,
    db.recipeIngredients,
    db.shifts,
    db.orders,
    db.orderRecipes,
    db.orderIngredients,
  ];
  const rows = await Promise.all(tables.map((table) => table.toArray()));
  return rows
    .flat()
    .map((row) => row.pk as string)
    .filter((pk) => pk === restaurantPk || pk.startsWith(`${restaurantPk}-`));
}

describe("useRestaurantStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    await clearDb();
  });

  it("lists restaurants from the local cache without calling the API", async () => {
    await db.restaurants.add(restaurant("r1", "Chez Toto"));
    const store = useRestaurantStore();

    await store.loadRestaurants();

    expect(store.restaurants.map((r) => r.name)).toEqual(["Chez Toto"]);
    expect(api.get).not.toHaveBeenCalled();
  });

  it("creates a restaurant on the server and keeps it locally", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: restaurant("r3", "Nouveau"),
    });
    const store = useRestaurantStore();

    await store.create("Nouveau");

    expect(api.post).toHaveBeenCalledWith("/restaurants/", { name: "Nouveau" });
    expect(store.restaurants.map((r) => r.pk)).toEqual(["r3"]);

    setActivePinia(createPinia());
    const reloaded = useRestaurantStore();
    await reloaded.loadRestaurants();
    expect(reloaded.restaurants.map((r) => r.pk)).toEqual(["r3"]);
  });

  it("updates a restaurant on the server and locally", async () => {
    await db.restaurants.bulkAdd([
      restaurant("r1", "Chez Toto"),
      restaurant("r2", "Autre"),
    ]);
    const updated = { ...restaurant("r1", "Chez Titi"), vat_rate: 10 };
    vi.mocked(api.patch).mockResolvedValue({ data: updated });
    const store = useRestaurantStore();
    await store.loadRestaurants();

    await store.update("r1", { name: "Chez Titi", vat_rate: 10 });

    expect(api.patch).toHaveBeenCalledWith("/restaurants/r1/", {
      name: "Chez Titi",
      vat_rate: 10,
    });
    expect(store.restaurants).toEqual([updated, restaurant("r2", "Autre")]);

    setActivePinia(createPinia());
    const reloaded = useRestaurantStore();
    await reloaded.loadRestaurants();
    expect(reloaded.restaurants).toEqual([updated, restaurant("r2", "Autre")]);
  });

  it("removes a restaurant and purges all of its local data", async () => {
    await seedRestaurant("r1");
    await seedRestaurant("r2");
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });
    const store = useRestaurantStore();
    await store.loadRestaurants();

    await store.remove("r1");

    expect(api.delete).toHaveBeenCalledWith("/restaurants/r1/");
    expect(store.restaurants.map((r) => r.pk)).toEqual(["r2"]);
    expect(await localPksOf("r1")).toEqual([]);
    expect(await localPksOf("r2")).toHaveLength(8);
  });

  it("keeps local data when the server refuses the deletion", async () => {
    await seedRestaurant("r1");
    vi.mocked(api.delete).mockRejectedValue(new Error("Network Error"));
    const store = useRestaurantStore();
    await store.loadRestaurants();

    await expect(store.remove("r1")).rejects.toThrow("Network Error");

    expect(store.restaurants.map((r) => r.pk)).toEqual(["r1"]);
    expect(await localPksOf("r1")).toHaveLength(8);
  });

  it("counts the unsynced shifts of a restaurant", async () => {
    const shift = (pk: string, restaurant: string, is_synced: boolean) => ({
      pk,
      restaurant,
      date: "2026-10-18T10:00:00.000Z",
      ended_at: null,
      vat_rate: 0,
      is_synced,
    });
    await db.shifts.bulkAdd([
      shift("s1", "r1", false),
      shift("s2", "r1", false),
      shift("s3", "r1", true),
      shift("s4", "r2", false),
    ]);
    const store = useRestaurantStore();

    expect(await store.unsyncedShiftCount("r1")).toBe(2);
    expect(await store.unsyncedShiftCount("r3")).toBe(0);
  });
});
