import type { Ingredient, RecipeIngredient } from "@/services/db";
import { IngredientUnit } from "@/utils/constant";

type Priced = Pick<Ingredient, "unit" | "price_per_unit">;

// Integer thousandths of a cent: prices have 2 decimals and quantities are
// integers in the base unit (g / ml / piece), so sums stay exact.
function costInMilliCents(ingredient: Priced, quantity: number) {
  const cents = Math.round(ingredient.price_per_unit * 100);
  return ingredient.unit === IngredientUnit.unit
    ? quantity * cents * 1000
    : quantity * cents;
}

// Rounded once, half up, like the API's Decimal + ROUND_HALF_UP.
function toEuros(milliCents: number) {
  return Math.round(milliCents / 1000) / 100;
}

export function ingredientCost(ingredient: Priced, quantity: number) {
  return toEuros(costInMilliCents(ingredient, quantity));
}

// Lines are summed unrounded: the cost may differ by a cent from the sum of
// the rounded line costs.
export function recipeCost(
  lines: Pick<RecipeIngredient, "ingredient" | "quantity">[],
  ingredients: ReadonlyMap<string, Priced>,
) {
  return toEuros(
    lines.reduce(
      (total, line) =>
        total +
        costInMilliCents(ingredients.get(line.ingredient)!, line.quantity),
      0,
    ),
  );
}

export function recipeMargin(price: number, cost: number) {
  return price - cost;
}

export function recipeCoefficient(price: number, cost: number) {
  return cost ? price / cost : null;
}
