import api from "@/services/apiClient";
import { type Recipe, type RecipeIngredient, db } from "@/services/db";

interface FullRecipe extends Recipe {
  recipe_ingredients: RecipeIngredient[];
}

export async function load(restaurantId: string) {
  const [recipesRes, ingredientsRes] = await Promise.all([
    api.get(`/restaurants/${restaurantId}/recipes/`),
    api.get(`/restaurants/${restaurantId}/ingredients/`),
  ]);

  const fullRecipes: FullRecipe[] = recipesRes.data;
  const recipeIngredients = fullRecipes.flatMap((r) => r.recipe_ingredients);
  const recipes = fullRecipes.map(({ recipe_ingredients: _, ...r }) => r);

  await Promise.all([
    db.recipes.bulkPut(recipes),
    db.ingredients.bulkPut(ingredientsRes.data),
    db.recipeIngredients.bulkPut(recipeIngredients),
  ]);
}
