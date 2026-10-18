import type { IngredientUnit, OrderStatus } from "@/utils/constant";
import Dexie, { type Table } from "dexie";

export interface Restaurant {
  pk: string;
  name: string;
  vat_rate: number;
}

export interface Shift {
  pk: string;
  restaurant: string;
  date: string;
  ended_at: string | null;
  is_synced: boolean;
}

export interface Order {
  pk: string;
  shift: string;
  customer_name: string;
  picking_time: string;
  status: OrderStatus;
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
  unit: IngredientUnit;
  price_per_unit: number;
  has_extra: boolean;
  /** Charged to the customer on each ADD; null unless has_extra. */
  extra_price: number | null;
  /** Portion of an extra, in the base unit (g / ml / piece); null unless has_extra. */
  extra_quantity: number | null;
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
  restaurants!: Table<Restaurant>;
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
      restaurants: "pk",
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

export async function purgeRestaurant(restaurantPk: string) {
  await db.transaction("rw", db.tables, async () => {
    const shiftPks = await db.shifts
      .where("restaurant")
      .equals(restaurantPk)
      .primaryKeys();
    const orderPks = await db.orders
      .where("shift")
      .anyOf(shiftPks)
      .primaryKeys();
    const orderRecipePks = await db.orderRecipes
      .where("order")
      .anyOf(orderPks)
      .primaryKeys();
    const recipePks = await db.recipes
      .where("restaurant")
      .equals(restaurantPk)
      .primaryKeys();

    await Promise.all([
      db.orderIngredients.where("order_recipe").anyOf(orderRecipePks).delete(),
      db.orderRecipes.bulkDelete(orderRecipePks),
      db.orders.bulkDelete(orderPks),
      db.shifts.bulkDelete(shiftPks),
      db.recipeIngredients.where("recipe").anyOf(recipePks).delete(),
      db.recipes.bulkDelete(recipePks),
      db.ingredients.where("restaurant").equals(restaurantPk).delete(),
      db.restaurants.delete(restaurantPk),
    ]);
  });
}
