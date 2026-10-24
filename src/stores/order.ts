import { defineStore } from "pinia";
import { ref } from "vue";
import { type Ingredient, type Order, type Recipe, db } from "@/services/db";
import { OrderStatus } from "@/utils/constant";
import { type Action, snapshotLine } from "@/utils/order";

export interface OrderLine {
  recipe: Recipe;
  unit_price: number;
  unit_cost: number;
  modifications: {
    ingredient: Ingredient;
    action: Action;
    extra_price: number;
    extra_cost: number;
  }[];
}

export interface CartLine {
  id: string;
  recipe: Recipe;
  modifications?: Record<string, Action>;
}

export const useOrderStore = defineStore("order", () => {
  const orders = ref<Order[]>([]);
  const lastUpdate = ref<{ pk: string } | null>(null);

  const lineTables = [
    db.orderRecipes,
    db.orderIngredients,
    db.shifts,
    db.recipeIngredients,
    db.ingredients,
  ];

  // Freezes each line's prices and costs from the cached catalogue.
  async function addLines(
    orderPk: string,
    shiftPk: string,
    cartLines: CartLine[],
  ) {
    const { restaurant } = (await db.shifts.get(shiftPk))!;
    const ingredients = await db.ingredients
      .where("restaurant")
      .equals(restaurant)
      .toArray();
    const ingredientsByPk = new Map(ingredients.map((i) => [i.pk, i]));
    const recipeLines = await db.recipeIngredients
      .where("recipe")
      .anyOf(cartLines.map((line) => line.recipe.pk))
      .toArray();

    for (const line of cartLines) {
      const snapshot = snapshotLine(line, recipeLines, ingredientsByPk);
      const orderRecipePk = crypto.randomUUID();
      await db.orderRecipes.add({
        pk: orderRecipePk,
        order: orderPk,
        recipe: line.recipe.pk,
        unit_price: snapshot.unit_price,
        unit_cost: snapshot.unit_cost,
        is_synced: false,
      });
      await db.orderIngredients.bulkAdd(
        snapshot.modifications.map((modification) => ({
          ...modification,
          pk: crypto.randomUUID(),
          order_recipe: orderRecipePk,
          is_synced: false,
        })),
      );
    }
  }

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

    await db.transaction("rw", [...lineTables, db.orders], async () => {
      await db.orders.add(order);
      await addLines(order.pk, shiftPk, cartLines);
    });

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
            extra_price: oi.extra_price,
            extra_cost: oi.extra_cost,
          })),
        );
        // Amounts come from the snapshots, never from the current catalogue.
        return {
          recipe: recipe!,
          unit_price: or.unit_price,
          unit_cost: or.unit_cost,
          modifications,
        };
      }),
    );
  }

  async function deleteOrder(orderPk: string) {
    await db.transaction(
      "rw",
      [db.orders, db.orderRecipes, db.orderIngredients],
      async () => {
        const orderRecipes = await db.orderRecipes
          .where("order")
          .equals(orderPk)
          .toArray();
        for (const or of orderRecipes) {
          await db.orderIngredients
            .where("order_recipe")
            .equals(or.pk)
            .delete();
        }
        await db.orderRecipes.where("order").equals(orderPk).delete();
        await db.orders.delete(orderPk);
      },
    );
    orders.value = orders.value.filter((o) => o.pk !== orderPk);
  }

  async function updateOrder(
    orderPk: string,
    customerName: string,
    pickingTime: Date,
    cartLines: CartLine[],
  ) {
    await db.transaction("rw", [...lineTables, db.orders], async () => {
      const orderRecipes = await db.orderRecipes
        .where("order")
        .equals(orderPk)
        .toArray();
      for (const or of orderRecipes) {
        await db.orderIngredients.where("order_recipe").equals(or.pk).delete();
      }
      await db.orderRecipes.where("order").equals(orderPk).delete();
      await db.orders.update(orderPk, {
        customer_name: customerName,
        picking_time: pickingTime.toISOString(),
        is_synced: false,
      });
      // Edited lines are snapshotted again, at current prices.
      const { shift } = (await db.orders.get(orderPk))!;
      await addLines(orderPk, shift, cartLines);
    });
    const order = orders.value.find((o) => o.pk === orderPk);
    if (order) {
      order.customer_name = customerName;
      order.picking_time = pickingTime.toISOString();
    }
    lastUpdate.value = { pk: orderPk };
  }

  return {
    orders,
    lastUpdate,
    loadOrders,
    updateStatus,
    createFullOrder,
    updateOrder,
    deleteOrder,
    loadOrderLines,
  };
});
