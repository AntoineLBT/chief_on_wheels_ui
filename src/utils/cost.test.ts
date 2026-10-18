import { describe, expect, it } from "vitest";
import { ingredientCost } from "@/utils/cost";
import { IngredientUnit } from "@/utils/constant";

describe("ingredientCost", () => {
  it("prices grams of an ingredient sold by the kilo", () => {
    const mozzarella = { unit: IngredientUnit.kg, price_per_unit: 12.5 };

    expect(ingredientCost(mozzarella, 80)).toBeCloseTo(1);
  });

  it("prices millilitres of an ingredient sold by the litre", () => {
    const oliveOil = { unit: IngredientUnit.l, price_per_unit: 9 };

    expect(ingredientCost(oliveOil, 15)).toBeCloseTo(0.135);
  });

  it("prices pieces of an ingredient sold by the unit", () => {
    const egg = { unit: IngredientUnit.unit, price_per_unit: 0.3 };

    expect(ingredientCost(egg, 2)).toBeCloseTo(0.6);
  });
});
