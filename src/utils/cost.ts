import type { Ingredient, RecipeIngredient } from "@/services/db";
import { IngredientUnit } from "@/utils/constant";

// Quantities are in the base unit (g / ml / piece), prices per KG, L or piece.
export function ingredientCost(
  ingredient: Pick<Ingredient, "unit" | "price_per_unit">,
  quantity: number,
) {
  const perBaseUnit =
    ingredient.unit === IngredientUnit.unit
      ? ingredient.price_per_unit
      : ingredient.price_per_unit / 1000;
  return quantity * perBaseUnit;
}

// Unrounded: rounding is left to display (the API rounds its own cost to the cent).
export function recipeCost(
  lines: Pick<RecipeIngredient, "ingredient" | "quantity">[],
  ingredients: ReadonlyMap<string, Pick<Ingredient, "unit" | "price_per_unit">>,
) {
  return lines.reduce(
    (total, line) =>
      total + ingredientCost(ingredients.get(line.ingredient)!, line.quantity),
    0,
  );
}

export function recipeMargin(price: number, cost: number) {
  return price - cost;
}

export function recipeCoefficient(price: number, cost: number) {
  return cost ? price / cost : null;
}
