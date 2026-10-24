import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import api from "@/services/apiClient";
import type { ApiRecipe } from "@/services/cache";
import { db } from "@/services/db";
import { useRecipeStore } from "@/stores/recipe";
import { useRecipeIngredientStore } from "@/stores/recipeIngredient";
import { clearDb } from "@/test/db";

vi.mock("@/services/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const margherita = {
  pk: "rc1",
  restaurant: "r1",
  name: "Margherita",
  price: 10,
  is_active: true,
};

function served(
  lines: ApiRecipe["recipe_ingredients"],
  overrides: Partial<ApiRecipe> = {},
): ApiRecipe {
  return { ...margherita, recipe_ingredients: lines, cost: 1, ...overrides };
}

async function reloaded() {
  setActivePinia(createPinia());
  const recipeStore = useRecipeStore();
  const recipeIngredientStore = useRecipeIngredientStore();
  await recipeStore.loadRecipes("r1");
  await recipeIngredientStore.loadRecipeIngredients(["rc1"]);
  return {
    recipes: recipeStore.recipes,
    lines: recipeIngredientStore.recipeIngredients.map((l) => l.pk).sort(),
  };
}

describe("useRecipeStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    await clearDb();
  });

  it("creates a recipe with its lines on the server and keeps them locally", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: served([{ pk: "l1", ingredient: "i1", quantity: 80 }]),
    });
    const store = useRecipeStore();
    await store.loadRecipes("r1");

    const input = {
      name: "Margherita",
      price: 10,
      is_active: true,
      recipe_ingredients: [{ ingredient: "i1", quantity: 80 }],
    };
    await store.create("r1", input);

    expect(api.post).toHaveBeenCalledWith("/restaurants/r1/recipes/", input);
    expect(store.recipes).toEqual([margherita]);
    expect(await reloaded()).toEqual({ recipes: [margherita], lines: ["l1"] });
  });

  it("updates a recipe and replaces its local lines", async () => {
    await db.recipes.add(margherita);
    await db.recipeIngredients.bulkAdd([
      { pk: "l1", recipe: "rc1", ingredient: "i1", quantity: 80 },
      { pk: "l2", recipe: "rc1", ingredient: "i2", quantity: 50 },
    ]);
    const deactivated = { ...margherita, is_active: false };
    vi.mocked(api.patch).mockResolvedValue({
      data: served([{ pk: "l3", ingredient: "i1", quantity: 90 }], {
        is_active: false,
      }),
    });
    const store = useRecipeStore();
    await store.loadRecipes("r1");

    const changes = {
      is_active: false,
      recipe_ingredients: [{ ingredient: "i1", quantity: 90 }],
    };
    await store.update("rc1", changes);

    expect(api.patch).toHaveBeenCalledWith(
      "/restaurants/r1/recipes/rc1/",
      changes,
    );
    expect(store.recipes).toEqual([deactivated]);
    expect(await reloaded()).toEqual({ recipes: [deactivated], lines: ["l3"] });
  });
});
