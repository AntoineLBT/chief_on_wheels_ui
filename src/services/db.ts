import Dexie, { type Table } from "dexie";

export interface Shift {
  pk: string;
  restaurant: string;
  date: string;
  ended_at: string | null;
  is_synced: boolean;
}

interface Order {
  pk: string;
  shift: string;
  customer_name: string;
  picking_time: string;
  status: "WAITING" | "IN_PROGRESS" | "DONE";
  is_synced: boolean;
}

export interface Recipe {
  pk: string;
  restaurant: string;
  name: string;
  price: number;
}

export interface Ingredient {
  pk: string;
  restaurant: string;
  name: string;
  price_by_kg: number;
}

export interface RecipeIngredient {
  pk: string;
  recipe: string;
  ingredient: string;
  quantity_in_g: number;
}

interface OrderRecipe {
  pk: string;
  order: string;
  recipe: string;
  is_synced: boolean;
}

interface OrderIngredient {
  pk: string;
  order_recipe: string;
  ingredient: string;
  action_type: "ADD" | "REMOVE";
  is_synced: boolean;
}

class ChiefDatabase extends Dexie {
  shifts!: Table<Shift>;
  orders!: Table<Order>;
  recipes!: Table<Recipe>;
  ingredients!: Table<Ingredient>;
  recipeIngredients!: Table<RecipeIngredient>;
  orderRecipes!: Table<OrderRecipe>;
  orderIngredients!: Table<OrderIngredient>;

  constructor() {
    super("chief");
    this.version(1).stores({
      shifts: "pk, restaurant, is_synced",
      orders: "pk, shift, is_synced",
      recipes: "pk, restaurant",
      ingredients: "pk, restaurant",
      recipeIngredients: "pk, recipe",
      orderRecipes: "pk, order, is_synced",
      orderIngredients: "pk, order_recipe, is_synced",
    });
  }
}
export const db = new ChiefDatabase();
