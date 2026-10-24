<template>
  <v-card prepend-icon="mdi-truck-outline" :title="title">
    <v-card-text>
      <div v-if="isLoading" class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate></v-progress-circular>
      </div>
      <v-alert v-else-if="error" type="error" variant="tonal" :text="error">
      </v-alert>
      <template v-else-if="report">
        <AccountingFigures :figures="report.totals"></AccountingFigures>

        <v-table class="mt-4" density="compact">
          <thead>
            <tr>
              <th>Pick-up</th>
              <th>Customer</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in report.breakdown" :key="order.order">
              <td>{{ formatTime(order.picking_time) }}</td>
              <td>{{ order.customer_name }}</td>
              <td class="text-right">{{ formatPrice(order.amount) }}</td>
              <td class="text-right">{{ formatPrice(order.cost) }}</td>
            </tr>
          </tbody>
        </v-table>
      </template>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="emit('close')">Close</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import AccountingFigures from "@/components/AccountingFigures.vue";
import { type ShiftReport, useAccountingStore } from "@/stores/accounting";
import { formatDate } from "@/utils/date";
import { formatPrice } from "@/utils/format";
import { computed, onMounted, ref } from "vue";

// Mounted afresh on each opening (keyed by the parent), so no manual reset.
const props = defineProps<{ restaurantPk: string; shiftPk: string }>();
const emit = defineEmits<{ close: [] }>();

const accountingStore = useAccountingStore();

const report = ref<ShiftReport | null>(null);
const isLoading = ref(true);
const error = ref("");

const title = computed(() =>
  report.value ? `Shift of ${formatDate(report.value.start)}` : "Shift",
);

function formatTime(isoDateTime: string) {
  return new Date(isoDateTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(async () => {
  try {
    report.value = await accountingStore.loadShift(
      props.restaurantPk,
      props.shiftPk,
    );
  } catch {
    error.value = "Could not load the shift. Check your connection.";
  } finally {
    isLoading.value = false;
  }
});
</script>
