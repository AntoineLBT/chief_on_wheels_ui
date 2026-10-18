import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import api from "@/services/apiClient";
import { db } from "@/services/db";
import { useRestaurantStore } from "@/stores/restaurant";
import { OrderStatus } from "@/utils/constant";
import { clearDb } from "@/test/db";

vi.mock("@/services/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

function restaurant(pk: string, name: string) {
  return { pk, name, vat_rate: "0.00", owner: 1 };
}

async function seedRestaurant(pk: string) {
  await db.restaurants.add(restaurant(pk, `Restaurant ${pk}`));
  await db.ingredients.add({
    pk: `${pk}-ingredient`,
    restaurant: pk,
    name: "Tomate",
    price_by_kg: 4,
  });
  await db.recipes.add({
    pk: `${pk}-recipe`,
    restaurant: pk,
    name: "Margherita",
    price: 10,
  });
  await db.recipeIngredients.add({
    pk: `${pk}-recipe-ingredient`,
    recipe: `${pk}-recipe`,
    ingredient: `${pk}-ingredient`,
    quantity_in_g: 80,
  });
  await db.shifts.add({
    pk: `${pk}-shift`,
    restaurant: pk,
    date: "2026-10-18T10:00:00.000Z",
    ended_at: null,
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
    is_synced: false,
  });
  await db.orderIngredients.add({
    pk: `${pk}-order-ingredient`,
    order_recipe: `${pk}-order-recipe`,
    ingredient: `${pk}-ingredient`,
    action_type: "ADD",
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
});
