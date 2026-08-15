import { db, type RecipeIngredient } from "@/services/db";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useRecipeIngredientStore = defineStore("recipeIngredient", () => {
  const recipeIngredients = ref<RecipeIngredient[]>([]);

  async function loadRecipeIngredients(recipePks: string[]) {
    recipeIngredients.value = await db.recipeIngredients
      .where("recipe")
      .anyOf(recipePks)
      .toArray();
  }

  function isDefaultIngredient(
    ingredientPk: string,
    recipePk: string,
  ): boolean {
    return recipeIngredients.value.some(
      (ri) => ri.recipe === recipePk && ri.ingredient === ingredientPk,
    );
  }

  return { recipeIngredients, loadRecipeIngredients, isDefaultIngredient };
});
