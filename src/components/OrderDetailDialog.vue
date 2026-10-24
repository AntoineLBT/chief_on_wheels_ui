<template>
  <v-card min-width="400">
    <v-card-item>
      <template #prepend>
        <v-icon :icon="statusIcon" :color="statusColor"></v-icon>
      </template>
      <v-card-title>{{ order.customer_name }}</v-card-title>
      <v-card-subtitle>
        Picking at
        {{ formatTime(order.picking_time) }}
      </v-card-subtitle>
    </v-card-item>

    <v-divider></v-divider>

    <v-card-text>
      <div v-if="lines.length">
        <div v-for="line in lines" :key="line.recipe.pk" class="mb-3">
          <div class="d-flex justify-space-between align-center">
            <span class="text-body-1 font-weight-medium">{{
              line.recipe.name
            }}</span>
            <span class="text-body-2">{{
              formatPrice(orderTotal([line]))
            }}</span>
          </div>
          <div
            v-for="mod in line.modifications"
            :key="mod.ingredient.pk"
            class="ms-3 text-caption"
            :class="mod.action === 'ADD' ? 'text-success' : 'text-error'"
          >
            {{ mod.action === "ADD" ? "+" : "-" }} {{ mod.ingredient.name }}
            <span v-if="mod.extra_price">
              ({{ formatPrice(mod.extra_price) }})</span
            >
          </div>
        </div>
      </div>
      <div v-else class="text-medium-emphasis text-body-2">No recipes.</div>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-item>
      <template #append>
        <span class="text-h6 font-weight-bold">{{ formatPrice(total) }}</span>
      </template>
      <v-card-title class="text-body-2 text-medium-emphasis"
        >Total</v-card-title
      >
    </v-card-item>

    <v-card-actions>
      <v-btn
        v-if="order.status !== OrderStatus.done"
        icon="mdi-pencil"
        variant="text"
        @click="emit('edit')"
      ></v-btn>
      <v-btn
        icon="mdi-delete-outline"
        variant="text"
        color="error"
        @click="confirmDelete = true"
      ></v-btn>
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="emit('close')">Close</v-btn>
    </v-card-actions>
  </v-card>

  <v-dialog v-model="confirmDelete" max-width="350">
    <v-card>
      <v-card-title>Delete order?</v-card-title>
      <v-card-text>
        This will permanently delete the order for
        <strong>{{ order.customer_name }}</strong
        >. This cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="confirmDelete = false">Cancel</v-btn>
        <v-btn color="error" variant="tonal" @click="onConfirmDelete"
          >Delete</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { type Order } from "@/services/db";
import { useOrderStore, type OrderLine } from "@/stores/order";
import { formatPrice, formatTime } from "@/utils/format";
import { orderTotal } from "@/utils/order";
import { OrderStatus } from "@/utils/constant";

const props = defineProps<{ order: Order }>();
const emit = defineEmits<{ close: []; edit: [] }>();

const orderStore = useOrderStore();
const lines = ref<OrderLine[]>([]);
const confirmDelete = ref(false);

// From the snapshots frozen at order creation.
const total = computed(() => orderTotal(lines.value));

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

async function onConfirmDelete() {
  await orderStore.deleteOrder(props.order.pk);
  emit("close");
}

onMounted(async () => {
  lines.value = await orderStore.loadOrderLines(props.order.pk);
});
</script>
