<template>
  <v-card :border="`${statusColor} md`" rounded="lg">
    <v-card-item>
      <template #prepend>
        <v-icon :icon="statusIcon" :color="statusColor" size="small"></v-icon>
      </template>
      <v-card-title class="text-body-1 font-weight-bold">
        {{ order.customer_name }}
      </v-card-title>
      <template #append>
        <v-chip :color="statusColor" size="small" variant="tonal">
          {{
            new Date(order.picking_time).toLocaleTimeString(
              _navigator.language,
              { hour: "2-digit", minute: "2-digit" },
            )
          }}
        </v-chip>
      </template>
    </v-card-item>

    <v-card-actions v-if="order.status !== OrderStatus.done">
      <v-spacer></v-spacer>
      <v-btn
        :color="statusColor"
        size="small"
        variant="tonal"
        :append-icon="
          order.status === OrderStatus.todo ? 'mdi-fire' : 'mdi-check'
        "
        @click="onUpdateStore"
      >
        {{ order.status === OrderStatus.todo ? "Start" : "Done" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { type Order } from "@/services/db";
import { useOrderStore } from "@/stores/order";
import { OrderStatus } from "@/utils/constant";

const orderStore = useOrderStore();
const props = defineProps<{ order: Order }>();

const _navigator = navigator;

const statusColor = computed(
  () =>
    ({
      [OrderStatus.todo]: "warning",
      [OrderStatus.inProgress]: "error",
      [OrderStatus.done]: "success",
    })[props.order.status],
);

const statusIcon = computed(
  () =>
    ({
      [OrderStatus.todo]: "mdi-clock-outline",
      [OrderStatus.inProgress]: "mdi-fire",
      [OrderStatus.done]: "mdi-check-circle-outline",
    })[props.order.status],
);

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
