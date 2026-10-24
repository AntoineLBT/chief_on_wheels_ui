import api from "@/services/apiClient";
import { type ApiRecipe, fromApiRecipe } from "@/services/cache";
import { db, type Recipe } from "@/services/db";
import { defineStore } from "pinia";
import { ref } from "vue";

export interface RecipeInput {
  name: string;
  price: number;
  is_active: boolean;
  recipe_ingredients: { ingredient: string; quantity: number }[];
}

export const useRecipeStore = defineStore("recipe", () => {
  const recipes = ref<Recipe[]>([]);

  async function loadRecipes(restaurantPk: string) {
    recipes.value = await db.recipes
      .where("restaurant")
      .equals(restaurantPk)
      .toArray();
  }

  // The server answer is authoritative: its lines replace the local ones.
  async function save(served: ApiRecipe) {
    const { recipe, lines } = fromApiRecipe(served);
    await db.transaction("rw", db.recipes, db.recipeIngredients, async () => {
      await db.recipes.put(recipe);
      await db.recipeIngredients.where("recipe").equals(recipe.pk).delete();
      await db.recipeIngredients.bulkPut(lines);
    });
    return recipe;
  }

  async function create(restaurantPk: string, input: RecipeInput) {
    const { data } = await api.post<ApiRecipe>(
      `/restaurants/${restaurantPk}/recipes/`,
      input,
    );
    const recipe = await save(data);
    recipes.value.push(recipe);
    return recipe;
  }

  async function update(recipePk: string, changes: Partial<RecipeInput>) {
    const { restaurant } = (await db.recipes.get(recipePk))!;
    const { data } = await api.patch<ApiRecipe>(
      `/restaurants/${restaurant}/recipes/${recipePk}/`,
      changes,
    );
    const recipe = await save(data);
    recipes.value = recipes.value.map((r) => (r.pk === recipePk ? recipe : r));
    return recipe;
  }

  return { recipes, loadRecipes, create, update };
});
