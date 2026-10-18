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
        <v-chip size="x-small" class="ms-2">{{ columnLists[col.status].length }}</v-chip>
      </div>
      <v-divider class="mb-3"></v-divider>
      <draggable
        v-model="columnLists[col.status]"
        group="orders"
        item-key="pk"
        :animation="150"
        ghost-class="drag-ghost"
        drag-class="drag-active"
        class="draggable-col"
        @change="(e: DraggableChangeEvent) => onColumnChange(e, col.status)"
      >
        <template #item="{ element: order }">
          <OrderCard
            :order="order"
            class="mb-3"
            @open="
              () => {
                selectedOrder = order;
                isDetailOpen = true;
              }
            "
          />
        </template>
        <template #footer>
          <div
            v-if="!columnLists[col.status].length"
            class="text-center text-medium-emphasis py-6"
          >
            No orders
          </div>
        </template>
      </draggable>
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
import { computed, onMounted, reactive, ref } from "vue";
import draggable from "vuedraggable";
import { useOrderStore } from "@/stores/order";
import { OrderStatus } from "@/utils/constant";
import OrderCard from "@/components/OrderCard.vue";
import NewOrderDialog from "@/components/NewOrderDialog.vue";
import OrderDetailDialog from "@/components/OrderDetailDialog.vue";
import type { Order } from "@/services/db";

const orderStore = useOrderStore();
const props = defineProps<{ shiftPk: string }>();

// Computed with no-op setters: vuedraggable needs v-model (it considers :model-value
// read-only and rejects drops), but the actual update is handled via @change + updateStatus.
const todoOrders = computed({
  get: () => orderStore.orders.filter((o) => o.status === OrderStatus.todo),
  set: () => {},
});
const inProgressOrders = computed({
  get: () =>
    orderStore.orders.filter((o) => o.status === OrderStatus.inProgress),
  set: () => {},
});
const doneOrders = computed({
  get: () => orderStore.orders.filter((o) => o.status === OrderStatus.done),
  set: () => {},
});

// reactive() auto-unwraps nested refs: reads return the array, writes call the computed setter.
const columnLists = reactive({
  [OrderStatus.todo]: todoOrders,
  [OrderStatus.inProgress]: inProgressOrders,
  [OrderStatus.done]: doneOrders,
});

const columns = computed(() => [
  {
    status: OrderStatus.todo,
    label: "To do",
    icon: "mdi-clock-outline",
    color: "warning",
  },
  {
    status: OrderStatus.inProgress,
    label: "In progress",
    icon: "mdi-fire",
    color: "error",
  },
  {
    status: OrderStatus.done,
    label: "Done",
    icon: "mdi-check-circle-outline",
    color: "success",
  },
]);

const isCreateDialogOpen = ref(false);
const isDetailOpen = ref(false);
const isEditDialogOpen = ref(false);
const selectedOrder = ref<Order>();

type DraggableChangeEvent = { added?: { element: Order } };

function onColumnChange(
  event: DraggableChangeEvent,
  newStatus: OrderStatus,
) {
  if (event.added) {
    orderStore.updateStatus(event.added.element.pk, newStatus);
  }
}

onMounted(async () => {
  await orderStore.loadOrders(props.shiftPk);
});
</script>

<style scoped>
.draggable-col {
  min-height: 60px;
}

.drag-ghost {
  opacity: 0.4;
}

.drag-active {
  cursor: grabbing !important;
}
</style>
