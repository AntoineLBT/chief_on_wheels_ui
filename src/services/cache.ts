import api from "@/services/apiClient";
import {
  type Ingredient,
  type Recipe,
  type RecipeIngredient,
  type Restaurant,
  db,
} from "@/services/db";

interface FullRecipe extends Recipe {
  recipe_ingredients: RecipeIngredient[];
}

async function fetchCatalogue(restaurantPk: string) {
  const [recipesRes, ingredientsRes] = await Promise.all([
    api.get<FullRecipe[]>(`/restaurants/${restaurantPk}/recipes/`),
    api.get<Ingredient[]>(`/restaurants/${restaurantPk}/ingredients/`),
  ]);
  return { fullRecipes: recipesRes.data, ingredients: ingredientsRes.data };
}

export async function load() {
  const { data: restaurants } = await api.get<Restaurant[]>("/restaurants/");
  // Fetch everything before touching Dexie: a network failure keeps the previous cache.
  const catalogues = await Promise.all(
    restaurants.map((r) => fetchCatalogue(r.pk)),
  );

  const fullRecipes = catalogues.flatMap((c) => c.fullRecipes);
  const recipeIngredients = fullRecipes.flatMap((r) => r.recipe_ingredients);
  const recipes = fullRecipes.map(({ recipe_ingredients: _, ...r }) => r);
  const ingredients = catalogues.flatMap((c) => c.ingredients);

  const catalogueTables = [
    db.restaurants,
    db.recipes,
    db.ingredients,
    db.recipeIngredients,
  ];
  // The catalogue is replaced, not merged, so server-side deletions propagate.
  await db.transaction("rw", catalogueTables, async () => {
    await Promise.all(catalogueTables.map((table) => table.clear()));
    await Promise.all([
      db.restaurants.bulkPut(restaurants),
      db.recipes.bulkPut(recipes),
      db.ingredients.bulkPut(ingredients),
      db.recipeIngredients.bulkPut(recipeIngredients),
    ]);
  });
}
