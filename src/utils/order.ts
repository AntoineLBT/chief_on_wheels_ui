import type { Ingredient, Recipe, RecipeIngredient } from "@/services/db";
import { ingredientCost, recipeCost } from "@/utils/cost";

export type Action = "ADD" | "REMOVE";

export interface ModificationSnapshot {
  ingredient: string;
  action_type: Action;
  extra_price: number;
  extra_cost: number;
}

/** Amounts frozen at order creation, so past accounting never changes. */
export interface LineSnapshot {
  unit_price: number;
  unit_cost: number;
  modifications: ModificationSnapshot[];
}

function snapshotModification(
  ingredient: Ingredient,
  action_type: Action,
): ModificationSnapshot {
  // Only an ADD of an extra is charged; a removal or a base switch is free.
  const isCharged = action_type === "ADD" && ingredient.has_extra;
  return {
    ingredient: ingredient.pk,
    action_type,
    extra_price: isCharged ? ingredient.extra_price! : 0,
    extra_cost: isCharged
      ? ingredientCost(ingredient, ingredient.extra_quantity!)
      : 0,
  };
}

export function snapshotLine(
  line: { recipe: Recipe; modifications?: Record<string, Action> },
  recipeLines: RecipeIngredient[],
  ingredientsByPk: ReadonlyMap<string, Ingredient>,
): LineSnapshot {
  return {
    unit_price: line.recipe.price,
    unit_cost: recipeCost(
      recipeLines.filter((l) => l.recipe === line.recipe.pk),
      ingredientsByPk,
    ),
    modifications: Object.entries(line.modifications ?? {}).map(
      ([ingredientPk, action]) =>
        snapshotModification(ingredientsByPk.get(ingredientPk)!, action),
    ),
  };
}

const toCents = (euros: number) => Math.round(euros * 100);

/** Σ unit_price + Σ extra_price, summed in cents. */
export function orderTotal(
  lines: { unit_price: number; modifications: { extra_price: number }[] }[],
) {
  const cents = lines.reduce(
    (total, line) =>
      total +
      toCents(line.unit_price) +
      line.modifications.reduce((sum, m) => sum + toCents(m.extra_price), 0),
    0,
  );
  return cents / 100;
}
