import { describe, expect, it } from "vitest";
import {
  ingredientCost,
  recipeCoefficient,
  recipeCost,
  recipeMargin,
} from "@/utils/cost";
import { IngredientUnit } from "@/utils/constant";

describe("ingredientCost", () => {
  it("prices grams of an ingredient sold by the kilo", () => {
    const mozzarella = { unit: IngredientUnit.kg, price_per_unit: 12.5 };

    expect(ingredientCost(mozzarella, 80)).toBe(1);
  });

  it("prices millilitres of an ingredient sold by the litre, to the cent", () => {
    const oliveOil = { unit: IngredientUnit.l, price_per_unit: 9 };

    // 13.5 cents, rounded half up.
    expect(ingredientCost(oliveOil, 15)).toBe(0.14);
  });

  it("prices pieces of an ingredient sold by the unit", () => {
    const egg = { unit: IngredientUnit.unit, price_per_unit: 0.3 };

    expect(ingredientCost(egg, 2)).toBe(0.6);
  });
});

// Cases shared with TestRecipeCost in chief_on_wheels_api/restaurants/tests/api/v1/test_recipe.py.
describe("recipeCost", () => {
  const ingredients = new Map([
    ["mozzarella", { unit: IngredientUnit.kg, price_per_unit: 12.5 }],
    ["huile", { unit: IngredientUnit.l, price_per_unit: 9 }],
    ["oeuf", { unit: IngredientUnit.unit, price_per_unit: 0.3 }],
  ]);

  it("sums the cost of every line of the recipe", () => {
    const lines = [
      { ingredient: "mozzarella", quantity: 80 },
      { ingredient: "huile", quantity: 15 },
      { ingredient: "oeuf", quantity: 2 },
    ];

    // 100 + 13.5 + 60 = 173.5 cents, rounded once: same as the API cost.
    expect(recipeCost(lines, ingredients)).toBe(1.74);
  });

  it("costs nothing without ingredients", () => {
    expect(recipeCost([], ingredients)).toBe(0);
  });
});

describe("recipeMargin", () => {
  it("is the price minus the cost", () => {
    expect(recipeMargin(10, 2.5)).toBeCloseTo(7.5);
  });
});

describe("recipeCoefficient", () => {
  it("is the price divided by the cost", () => {
    expect(recipeCoefficient(10, 2.5)).toBeCloseTo(4);
  });

  it("is undefined when the recipe costs nothing", () => {
    expect(recipeCoefficient(10, 0)).toBeNull();
  });
});
