import { defineStore } from "pinia";
import { ref } from "vue";
import { type Ingredient, type Order, type Recipe, db } from "@/services/db";
import { OrderStatus } from "@/utils/constant";

export interface OrderLine {
  recipe: Recipe;
  modifications: { ingredient: Ingredient; action: "ADD" | "REMOVE" }[];
}

export interface CartLine {
  id: string;
  recipe: Recipe;
  modifications?: Record<string, "ADD" | "REMOVE">;
}

export const useOrderStore = defineStore("order", () => {
  const orders = ref<Order[]>([]);

  async function loadOrders(shiftPk: string) {
    orders.value = await db.orders.where("shift").equals(shiftPk).toArray();
  }

  async function updateStatus(orderPk: string, newStatus: OrderStatus) {
    await db.orders.update(orderPk, { status: newStatus });
    const order = orders.value.find((o) => o.pk === orderPk);
    if (order) order.status = newStatus;
  }

  async function createFullOrder(
    shiftPk: string,
    customerName: string,
    pickingTime: Date,
    cartLines: CartLine[],
  ) {
    const order: Order = {
      pk: crypto.randomUUID(),
      shift: shiftPk,
      customer_name: customerName,
      picking_time: pickingTime.toISOString(),
      status: OrderStatus.todo,
      is_synced: false,
    };

    await db.transaction(
      "rw",
      [db.orders, db.orderRecipes, db.orderIngredients],
      async () => {
        await db.orders.add(order);

        for (const line of cartLines) {
          const orderRecipe = {
            pk: crypto.randomUUID(),
            order: order.pk,
            recipe: line.recipe.pk,
            is_synced: false,
          };
          await db.orderRecipes.add(orderRecipe);

          if (line.modifications) {
            for (const [ingredientPk, actionType] of Object.entries(
              line.modifications,
            )) {
              await db.orderIngredients.add({
                pk: crypto.randomUUID(),
                order_recipe: orderRecipe.pk,
                ingredient: ingredientPk,
                action_type: actionType,
                is_synced: false,
              });
            }
          }
        }
      },
    );

    orders.value.push(order);
  }

  async function loadOrderLines(orderPk: string): Promise<OrderLine[]> {
    const orderRecipes = await db.orderRecipes
      .where("order")
      .equals(orderPk)
      .toArray();

    return Promise.all(
      orderRecipes.map(async (or) => {
        const recipe = await db.recipes.get(or.recipe);
        const orderIngredients = await db.orderIngredients
          .where("order_recipe")
          .equals(or.pk)
          .toArray();
        const modifications = await Promise.all(
          orderIngredients.map(async (oi) => ({
            ingredient: (await db.ingredients.get(oi.ingredient))!,
            action: oi.action_type,
          })),
        );
        return { recipe: recipe!, modifications };
      }),
    );
  }

  return {
    orders,
    loadOrders,
    updateStatus,
    createFullOrder,
    loadOrderLines,
  };
});
