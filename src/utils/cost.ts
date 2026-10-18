import type { Ingredient } from "@/services/db";
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
