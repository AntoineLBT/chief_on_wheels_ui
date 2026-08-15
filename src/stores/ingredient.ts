import { db, type Ingredient } from "@/services/db";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useIngredientStore = defineStore("ingredient", () => {
  const ingredients = ref<Ingredient[]>([]);

  async function loadIngredients(restaurantPk: string) {
    ingredients.value = await db.ingredients
      .where("restaurant")
      .equals(restaurantPk)
      .toArray();
  }

  function getIngredient(ingredientPk: string) {
    return ingredients.value.find(
      (ingredient) => ingredient.pk == ingredientPk,
    )!;
  }

  return { ingredients, loadIngredients, getIngredient };
});
