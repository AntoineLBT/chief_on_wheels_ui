import api from "@/services/apiClient";
import { db, type Ingredient } from "@/services/db";
import { isAxiosError } from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";

export type IngredientInput = Omit<Ingredient, "pk" | "restaurant">;

export class IngredientInUseError extends Error {
  constructor(readonly recipeCount: number) {
    super(`Ingredient used in ${recipeCount} recipe(s)`);
    this.name = "IngredientInUseError";
  }
}

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

  async function url(ingredientPk: string) {
    const { restaurant } = (await db.ingredients.get(ingredientPk))!;
    return `/restaurants/${restaurant}/ingredients/${ingredientPk}/`;
  }

  async function create(restaurantPk: string, input: IngredientInput) {
    const { data } = await api.post<Ingredient>(
      `/restaurants/${restaurantPk}/ingredients/`,
      input,
    );
    await db.ingredients.put(data);
    ingredients.value.push(data);
    return data;
  }

  async function update(
    ingredientPk: string,
    changes: Partial<IngredientInput>,
  ) {
    const { data } = await api.patch<Ingredient>(
      await url(ingredientPk),
      changes,
    );
    await db.ingredients.put(data);
    ingredients.value = ingredients.value.map((i) =>
      i.pk === ingredientPk ? data : i,
    );
    return data;
  }

  async function remove(ingredientPk: string) {
    try {
      await api.delete(await url(ingredientPk));
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        throw new IngredientInUseError(error.response.data.recipe_count);
      }
      throw error;
    }
    await db.ingredients.delete(ingredientPk);
    ingredients.value = ingredients.value.filter((i) => i.pk !== ingredientPk);
  }

  return {
    ingredients,
    loadIngredients,
    getIngredient,
    create,
    update,
    remove,
  };
});
