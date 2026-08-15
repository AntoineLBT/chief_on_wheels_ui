import { defineStore } from "pinia";
import { ref } from "vue";
import { type Order, type Recipe, db } from "@/services/db";
import { OrderStatus } from "@/utils/constant";

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

  async function createOrder(
    shiftPk: string,
    customerName: string,
    pickingTime: Date,
  ) {
    const order: Order = {
      pk: crypto.randomUUID(),
      shift: shiftPk,
      customer_name: customerName,
      picking_time: pickingTime.toISOString(),
      status: OrderStatus.todo,
      is_synced: false,
    };

    await db.orders.add(order);
    orders.value.push(order);
    return order;
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
    await db.transaction(
      "rw",
      [db.orders, db.orderRecipes, db.orderIngredients],
      async () => {
        const order = await createOrder(shiftPk, customerName, pickingTime);

        for (const line of cartLines) {
          const orderRecipe = {
            pk: crypto.randomUUID(),
            order: order.pk,
            recipe: line.recipe.pk,
            is_synced: false,
          };
          await db.orderRecipes.add(orderRecipe);

          if (line.modifications){
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
        return order;
      },
    );
  }

  return {
    orders,
    loadOrders,
    createOrder,
    updateStatus,
    createFullOrder,
  };
});
