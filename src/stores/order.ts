import { defineStore } from "pinia";
import { ref } from "vue";
import { type Order, db } from "@/services/db";
import { OrderStatus } from "@/utils/constant";

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

  return { orders, loadOrders, createOrder, updateStatus };
});
