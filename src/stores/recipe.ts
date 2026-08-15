import { defineStore } from "pinia";
import { db, type Recipe } from "../services/db";
import { ref } from "vue";

export const useRecipeStore = defineStore("recipe", () => {
  const recipes = ref<Recipe[]>([]);

  async function loadRecipes(restaurantPk: string) {
    recipes.value = await db.recipes
      .where("restaurant")
      .equals(restaurantPk)
      .toArray();
  }

  return { recipes, loadRecipes };
});
