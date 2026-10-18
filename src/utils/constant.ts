export enum OrderStatus {
  todo = "TODO",
  inProgress = "IN_PROGRESS",
  done = "DONE",
}

export enum IngredientUnit {
  kg = "KG",
  l = "L",
  unit = "UNIT",
}

export const ingredientUnitLabels: Record<IngredientUnit, string> = {
  [IngredientUnit.kg]: "kg",
  [IngredientUnit.l]: "l",
  [IngredientUnit.unit]: "piece",
};

// Recipe and extra quantities are expressed in this base unit.
export const ingredientBaseUnitLabels: Record<IngredientUnit, string> = {
  [IngredientUnit.kg]: "g",
  [IngredientUnit.l]: "ml",
  [IngredientUnit.unit]: "pc",
};
