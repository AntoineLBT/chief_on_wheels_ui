import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import api from "@/services/apiClient";
import { load } from "@/services/cache";
import { db } from "@/services/db";
import { useRestaurantStore } from "@/stores/restaurant";
import { useRecipeStore } from "@/stores/recipe";
import { useRecipeIngredientStore } from "@/stores/recipeIngredient";
import { useShiftStore } from "@/stores/shift";
import { IngredientUnit } from "@/utils/constant";
import { clearDb } from "@/test/db";

vi.mock("@/services/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

function restaurant(pk: string, name: string) {
  return { pk, name, vat_rate: 0, owner: 1 };
}

function recipe(pk: string, restaurantPk: string, name: string) {
  return {
    pk,
    restaurant: restaurantPk,
    name,
    price: 10,
    is_active: true,
    recipe_ingredients: [
      { pk: `${pk}-ri`, ingredient: `${restaurantPk}-tomate`, quantity: 80 },
    ],
    cost: 0.32,
  };
}

function ingredient(restaurantPk: string) {
  return {
    pk: `${restaurantPk}-tomate`,
    restaurant: restaurantPk,
    name: "Tomate",
    unit: IngredientUnit.kg,
    price_per_unit: 4,
    has_extra: false,
    extra_price: null,
    extra_quantity: null,
  };
}

function serve(routes: Record<string, unknown>) {
  vi.mocked(api.get).mockImplementation(async (url: string) => {
    if (!(url in routes)) throw new Error(`Unexpected GET ${url}`);
    return { data: routes[url] };
  });
}

describe("cache.load", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    await clearDb();
  });

  it("caches every restaurant of the user with its catalogue", async () => {
    serve({
      "/restaurants/": [
        restaurant("r1", "Chez Toto"),
        restaurant("r2", "La Bonne Pâte"),
      ],
      "/restaurants/r1/recipes/": [recipe("margherita", "r1", "Margherita")],
      "/restaurants/r1/ingredients/": [ingredient("r1")],
      "/restaurants/r2/recipes/": [recipe("calzone", "r2", "Calzone")],
      "/restaurants/r2/ingredients/": [ingredient("r2")],
    });

    await load();

    const restaurantStore = useRestaurantStore();
    await restaurantStore.loadRestaurants();
    expect(restaurantStore.restaurants.map((r) => r.name).sort()).toEqual([
      "Chez Toto",
      "La Bonne Pâte",
    ]);

    const recipeStore = useRecipeStore();
    await recipeStore.loadRecipes("r2");
    expect(recipeStore.recipes.map((r) => r.name)).toEqual(["Calzone"]);
  });

  it("caches recipe lines under their recipe, and no cost", async () => {
    serve({
      "/restaurants/": [restaurant("r1", "Chez Toto")],
      "/restaurants/r1/recipes/": [recipe("margherita", "r1", "Margherita")],
      "/restaurants/r1/ingredients/": [ingredient("r1")],
    });

    await load();

    const recipeStore = useRecipeStore();
    await recipeStore.loadRecipes("r1");
    // The cost is recomputed from the cached ingredients, never cached.
    expect(recipeStore.recipes).toEqual([
      {
        pk: "margherita",
        restaurant: "r1",
        name: "Margherita",
        price: 10,
        is_active: true,
      },
    ]);
    const recipeIngredientStore = useRecipeIngredientStore();
    await recipeIngredientStore.loadRecipeIngredients(["margherita"]);
    expect(recipeIngredientStore.recipeIngredients).toEqual([
      {
        pk: "margherita-ri",
        recipe: "margherita",
        ingredient: "r1-tomate",
        quantity: 80,
      },
    ]);
  });

  it("drops restaurants and recipes that no longer exist on the server", async () => {
    serve({
      "/restaurants/": [
        restaurant("r1", "Chez Toto"),
        restaurant("r2", "La Bonne Pâte"),
      ],
      "/restaurants/r1/recipes/": [
        recipe("margherita", "r1", "Margherita"),
        recipe("reine", "r1", "Reine"),
      ],
      "/restaurants/r1/ingredients/": [ingredient("r1")],
      "/restaurants/r2/recipes/": [recipe("calzone", "r2", "Calzone")],
      "/restaurants/r2/ingredients/": [ingredient("r2")],
    });
    await load();

    serve({
      "/restaurants/": [restaurant("r1", "Chez Toto")],
      "/restaurants/r1/recipes/": [recipe("margherita", "r1", "Margherita")],
      "/restaurants/r1/ingredients/": [ingredient("r1")],
    });
    await load();

    const restaurantStore = useRestaurantStore();
    await restaurantStore.loadRestaurants();
    expect(restaurantStore.restaurants.map((r) => r.pk)).toEqual(["r1"]);

    const recipeStore = useRecipeStore();
    await recipeStore.loadRecipes("r1");
    expect(recipeStore.recipes.map((r) => r.name)).toEqual(["Margherita"]);
    await recipeStore.loadRecipes("r2");
    expect(recipeStore.recipes).toEqual([]);
  });

  it("keeps unsynced shifts untouched", async () => {
    await db.shifts.add({
      pk: "shift-1",
      restaurant: "r1",
      date: "2026-10-18T10:00:00.000Z",
      ended_at: null,
      is_synced: false,
    });
    serve({
      "/restaurants/": [restaurant("r1", "Chez Toto")],
      "/restaurants/r1/recipes/": [],
      "/restaurants/r1/ingredients/": [],
    });

    await load();

    expect(await useShiftStore().getShift("shift-1")).toMatchObject({
      restaurant: "r1",
      is_synced: false,
    });
  });
});
