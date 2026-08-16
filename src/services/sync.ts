import { db } from "@/services/db";
import api from "./apiClient";

export async function sync() {
  const all = await db.shifts.toArray();
  const unSyncedShifts = all.filter((s) => !s.is_synced);

  for (const shift of unSyncedShifts) {
    const orders = await db.orders.where("shift").equals(shift.pk).toArray();

    const payload = {
      id: shift.pk,
      restaurant: shift.restaurant,
      date: shift.date,
      ended_at: shift.ended_at,
      orders: await Promise.all(
        orders.map(async (order) => ({
          id: order.pk,
          customer_name: order.customer_name,
          picking_time: order.picking_time,
          status: order.status,
          order_recipes: await Promise.all(
            (
              await db.orderRecipes.where("order").equals(order.pk).toArray()
            ).map(async (orderRecipe) => ({
              id: orderRecipe.pk,
              recipe: orderRecipe.recipe,
              order_ingredients: (
                await db.orderIngredients
                  .where("order_recipe")
                  .equals(orderRecipe.pk)
                  .toArray()
              ).map((orderIngredient) => ({
                id: orderIngredient.pk,
                ingredient: orderIngredient.ingredient,
                action_type: orderIngredient.action_type,
              })),
            })),
          ),
        })),
      ),
    };
    await api.post("/sync/", payload);

    await db.shifts.update(shift.pk, { is_synced: true });

    for (const order of orders) {
      await db.orders.update(order.pk, { is_synced: true });
      const orderRecipes = await db.orderRecipes
        .where("order")
        .equals(order.pk)
        .toArray();
      for (const or of orderRecipes) {
        await db.orderRecipes.update(or.pk, { is_synced: true });
        await db.orderIngredients
          .where("order_recipe")
          .equals(or.pk)
          .modify({ is_synced: true });
      }
    }
  }
}
