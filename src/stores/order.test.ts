import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { db } from "@/services/db";
import { useOrderStore } from "@/stores/order";
import { IngredientUnit } from "@/utils/constant";
import { orderTotal } from "@/utils/order";
import { clearDb } from "@/test/db";

const margherita = {
  pk: "margherita",
  restaurant: "r1",
  name: "Margherita",
  price: 10,
  is_active: true,
};

async function seedCatalogue() {
  await db.shifts.add({
    pk: "s1",
    restaurant: "r1",
    date: "2026-10-24T10:00:00.000Z",
    ended_at: null,
    is_synced: false,
  });
  await db.recipes.add(margherita);
  await db.ingredients.add({
    pk: "mozzarella",
    restaurant: "r1",
    name: "Mozzarella",
    unit: IngredientUnit.kg,
    price_per_unit: 12.5,
    has_extra: true,
    extra_price: 1.5,
    extra_quantity: 40,
  });
  await db.recipeIngredients.add({
    pk: "l1",
    recipe: "margherita",
    ingredient: "mozzarella",
    quantity: 80,
  });
}

describe("useOrderStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await clearDb();
    await seedCatalogue();
  });

  it("freezes prices and costs when the order is created", async () => {
    const store = useOrderStore();
    await store.createFullOrder("s1", "Jean", new Date(), [
      { id: "c1", recipe: margherita, modifications: { mozzarella: "ADD" } },
    ]);

    // The catalogue changes afterwards (a management screen, a cache reload).
    await db.recipes.update("margherita", { price: 13 });
    await db.ingredients.update("mozzarella", {
      price_per_unit: 20,
      extra_price: 3,
    });

    const [line] = await store.loadOrderLines(store.orders[0]!.pk);
    expect(line).toMatchObject({ unit_price: 10, unit_cost: 1 });
    expect(line!.modifications).toMatchObject([
      { action: "ADD", extra_price: 1.5, extra_cost: 0.5 },
    ]);
    expect(orderTotal([line!])).toBe(11.5);
  });
});
