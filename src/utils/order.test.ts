import { describe, expect, it } from "vitest";
import type { Ingredient } from "@/services/db";
import { IngredientUnit } from "@/utils/constant";
import { orderTotal, snapshotLine } from "@/utils/order";

function ingredient(pk: string, overrides: Partial<Ingredient> = {}) {
  return {
    pk,
    restaurant: "r1",
    name: pk,
    unit: IngredientUnit.kg,
    price_per_unit: 12.5,
    has_extra: false,
    extra_price: null,
    extra_quantity: null,
    ...overrides,
  };
}

const ingredientsByPk = new Map(
  [
    ingredient("mozzarella", {
      has_extra: true,
      extra_price: 1.5,
      extra_quantity: 40,
    }),
    ingredient("tomate", {
      has_extra: true,
      extra_price: 1,
      extra_quantity: 30,
    }),
    ingredient("basilic"),
  ].map((i) => [i.pk, i]),
);

const margherita = {
  pk: "margherita",
  restaurant: "r1",
  name: "Margherita",
  price: 10,
  is_active: true,
};
const recipeLines = [
  { pk: "l1", recipe: "margherita", ingredient: "mozzarella", quantity: 80 },
];

describe("snapshotLine", () => {
  it("freezes the recipe price and cost", () => {
    const snapshot = snapshotLine(
      { recipe: margherita },
      recipeLines,
      ingredientsByPk,
    );

    expect(snapshot).toEqual({
      unit_price: 10,
      unit_cost: 1,
      modifications: [],
    });
  });

  it("charges an added extra: its price, and the cost of its portion", () => {
    const snapshot = snapshotLine(
      { recipe: margherita, modifications: { mozzarella: "ADD" } },
      recipeLines,
      ingredientsByPk,
    );

    // 40 g at 12.50 € / kg.
    expect(snapshot.modifications).toEqual([
      {
        ingredient: "mozzarella",
        action_type: "ADD",
        extra_price: 1.5,
        extra_cost: 0.5,
      },
    ]);
  });

  it("charges nothing for an added ingredient without extra, nor a removal", () => {
    const snapshot = snapshotLine(
      {
        recipe: margherita,
        modifications: { basilic: "ADD", tomate: "REMOVE" },
      },
      recipeLines,
      ingredientsByPk,
    );

    expect(snapshot.modifications).toEqual([
      {
        ingredient: "basilic",
        action_type: "ADD",
        extra_price: 0,
        extra_cost: 0,
      },
      {
        ingredient: "tomate",
        action_type: "REMOVE",
        extra_price: 0,
        extra_cost: 0,
      },
    ]);
  });
});

describe("orderTotal", () => {
  it("sums recipe prices and extra prices, to the cent", () => {
    const lines = [
      {
        unit_price: 10.5,
        modifications: [{ extra_price: 0.2 }, { extra_price: 0.1 }],
      },
    ];

    expect(orderTotal(lines)).toBe(10.8);
  });

  it("is zero for an empty order", () => {
    expect(orderTotal([])).toBe(0);
  });
});
