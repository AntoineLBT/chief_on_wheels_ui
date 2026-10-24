import api from "@/services/apiClient";
import {
  type Ingredient,
  type Recipe,
  type RecipeIngredient,
  type Restaurant,
  db,
} from "@/services/db";

/** A recipe as the API serves it: lines nested without `recipe`, plus `cost`. */
export interface ApiRecipe extends Recipe {
  recipe_ingredients: Omit<RecipeIngredient, "recipe">[];
  cost: number;
}

// The cost is dropped: it would go stale when an ingredient price changes,
// so the UI always recomputes it from the cached ingredients.
export function fromApiRecipe({
  recipe_ingredients,
  cost: _,
  ...recipe
}: ApiRecipe) {
  const lines: RecipeIngredient[] = recipe_ingredients.map((line) => ({
    ...line,
    recipe: recipe.pk,
  }));
  return { recipe, lines };
}

async function fetchCatalogue(restaurantPk: string) {
  const [recipesRes, ingredientsRes] = await Promise.all([
    api.get<ApiRecipe[]>(`/restaurants/${restaurantPk}/recipes/`),
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

  const split = catalogues.flatMap((c) => c.fullRecipes.map(fromApiRecipe));
  const recipes = split.map((r) => r.recipe);
  const recipeIngredients = split.flatMap((r) => r.lines);
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
