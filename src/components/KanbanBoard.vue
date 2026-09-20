<template>
  <v-row class="justify-end mb-2">
    <v-col cols="auto">
      <v-btn
        prepend-icon="mdi-plus-circle-outline"
        color="primary"
        @click="isCreateDialogOpen = true"
        >New order</v-btn
      >
    </v-col>
  </v-row>

  <v-row>
    <v-col v-for="col in columns" :key="col.status" cols="4">
      <div class="d-flex align-center mb-3">
        <v-icon :icon="col.icon" :color="col.color" class="me-2"></v-icon>
        <span class="text-subtitle-1 font-weight-bold">{{ col.label }}</span>
        <v-chip size="x-small" class="ms-2">{{ col.orders.length }}</v-chip>
      </div>
      <v-divider class="mb-3"></v-divider>
      <OrderCard
        v-for="order in col.orders"
        :key="order.pk"
        :order="order"
        class="mb-3"
        @open="
          () => {
            selectedOrder = order;
            isDetailOpen = true;
          }
        "
      />
      <div
        v-if="!col.orders.length"
        class="text-center text-medium-emphasis py-6"
      >
        No orders
      </div>
    </v-col>
  </v-row>

  <v-dialog v-model="isCreateDialogOpen" max-width="75%">
    <NewOrderDialog
      :shift-pk="props.shiftPk"
      @close="isCreateDialogOpen = false"
    ></NewOrderDialog>
  </v-dialog>

  <v-dialog v-model="isEditDialogOpen" max-width="75%">
    <NewOrderDialog
      v-if="selectedOrder"
      :shift-pk="props.shiftPk"
      :order="selectedOrder"
      @close="isEditDialogOpen = false"
    ></NewOrderDialog>
  </v-dialog>

  <v-dialog v-model="isDetailOpen" max-width="500">
    <OrderDetailDialog
      v-if="selectedOrder"
      :order="selectedOrder"
      @close="isDetailOpen = false"
      @edit="
        () => {
          isDetailOpen = false;
          isEditDialogOpen = true;
        }
      "
    ></OrderDetailDialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useOrderStore } from "@/stores/order";
import { OrderStatus } from "@/utils/constant";
import OrderCard from "@/components/OrderCard.vue";
import NewOrderDialog from "@/components/NewOrderDialog.vue";
import OrderDetailDialog from "@/components/OrderDetailDialog.vue";
import type { Order } from "@/services/db";

const orderStore = useOrderStore();
const props = defineProps<{ shiftPk: string }>();

const todo = computed(() =>
  orderStore.orders.filter((o) => o.status === OrderStatus.todo),
);
const inProgress = computed(() =>
  orderStore.orders.filter((o) => o.status === OrderStatus.inProgress),
);
const done = computed(() =>
  orderStore.orders.filter((o) => o.status === OrderStatus.done),
);

const columns = computed(() => [
  {
    status: OrderStatus.todo,
    label: "To do",
    icon: "mdi-clock-outline",
    color: "warning",
    orders: todo.value,
  },
  {
    status: OrderStatus.inProgress,
    label: "In progress",
    icon: "mdi-fire",
    color: "error",
    orders: inProgress.value,
  },
  {
    status: OrderStatus.done,
    label: "Done",
    icon: "mdi-check-circle-outline",
    color: "success",
    orders: done.value,
  },
]);

const isCreateDialogOpen = ref(false);
const isDetailOpen = ref(false);
const isEditDialogOpen = ref(false);
const selectedOrder = ref<Order>();

onMounted(async () => {
  await orderStore.loadOrders(props.shiftPk);
});
</script>
