<template>
  <v-card
    :border="`${statusColor} md`"
    rounded="lg"
    style="cursor: pointer"
    @click="emit('open')"
  >
    <v-card-item>
      <template #prepend>
        <v-icon :icon="statusIcon" :color="statusColor" size="small"></v-icon>
      </template>
      <v-card-title class="text-body-1 font-weight-bold">
        {{ order.customer_name }}
      </v-card-title>
      <template #append>
        <v-chip :color="statusColor" size="small" variant="tonal">
          {{ formatTime(order.picking_time) }}
        </v-chip>
      </template>
    </v-card-item>

    <v-card-text class="pt-0">
      <div v-if="order.status === OrderStatus.todo" class="text-body-2">
        <v-icon icon="mdi-pizza" size="small" class="me-1"></v-icon>
        {{ lines.length }} pizza{{ lines.length !== 1 ? "s" : "" }}
      </div>

      <div v-else-if="order.status === OrderStatus.inProgress">
        <div v-for="line in lines" :key="line.recipe.pk" class="mb-1">
          <span class="text-body-2 font-weight-medium">{{
            line.recipe.name
          }}</span>
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

      <div
        v-else-if="order.status === OrderStatus.done"
        class="text-body-2 font-weight-bold"
      >
        <v-icon icon="mdi-cash" size="small" class="me-1"></v-icon>
        {{ formatPrice(total) }}
      </div>
    </v-card-text>

    <v-card-actions v-if="order.status !== OrderStatus.done">
      <v-spacer></v-spacer>
      <v-btn
        :color="statusColor"
        size="small"
        variant="tonal"
        :append-icon="
          order.status === OrderStatus.todo ? 'mdi-fire' : 'mdi-check'
        "
        @click.stop="onUpdateStore"
      >
        {{ order.status === OrderStatus.todo ? "Start" : "Done" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { type Order } from "@/services/db";
import { useOrderStore, type OrderLine } from "@/stores/order";
import { formatPrice, formatTime } from "@/utils/format";
import { orderTotal } from "@/utils/order";
import { OrderStatus } from "@/utils/constant";

const orderStore = useOrderStore();
const props = defineProps<{ order: Order }>();
const emit = defineEmits<{ open: [] }>();

const lines = ref<OrderLine[]>([]);

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

async function reloadLines() {
  lines.value = await orderStore.loadOrderLines(props.order.pk);
}

onMounted(reloadLines);
watch(() => props.order.status, reloadLines);
watch(
  () => orderStore.lastUpdate,
  (update) => {
    if (update?.pk === props.order.pk) reloadLines();
  },
);
</script>
