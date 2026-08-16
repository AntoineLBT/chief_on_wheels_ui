<template>
  <v-card class="mt-8">
    <h2>
      {{ order.customer_name }} -
      {{
        new Date(order.picking_time).toLocaleTimeString(_navigator.language, {
          hour: "2-digit",
          minute: "2-digit",
        })
      }}
    </h2>
    <v-btn v-if="order.status !== OrderStatus.done" @click="onUpdateStore"
      >Next status</v-btn
    >
  </v-card>
</template>

<script setup lang="ts">
import { type Order } from "@/services/db";
import { useOrderStore } from "@/stores/order";
import { OrderStatus } from "@/utils/constant";

const orderStore = useOrderStore();
const props = defineProps<{ order: Order }>();

const _navigator = navigator;

async function onUpdateStore() {
  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    [OrderStatus.todo]: OrderStatus.inProgress,
    [OrderStatus.inProgress]: OrderStatus.done,
  };
  await orderStore.updateStatus(
    props.order.pk,
    nextStatus[props.order.status]!,
  );
}
</script>
