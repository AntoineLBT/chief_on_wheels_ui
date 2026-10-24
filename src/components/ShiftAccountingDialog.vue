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
              <th>{{ t("accounting.pickUp") }}</th>
              <th>{{ t("accounting.customer") }}</th>
              <th class="text-right">{{ t("common.amount") }}</th>
              <th class="text-right">{{ t("common.cost") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in report.breakdown"
              :key="order.order"
              :class="{ 'text-disabled': order.status !== OrderStatus.done }"
            >
              <td>{{ formatTime(order.picking_time) }}</td>
              <td>
                {{ order.customer_name }}
                <v-chip
                  v-if="order.status !== OrderStatus.done"
                  size="x-small"
                  color="warning"
                  class="ms-2"
                  >{{ t("accounting.notCounted") }}</v-chip
                >
              </td>
              <td class="text-right">{{ formatPrice(order.amount) }}</td>
              <td class="text-right">{{ formatPrice(order.cost) }}</td>
            </tr>
          </tbody>
        </v-table>
      </template>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="emit('close')">{{
        t("common.close")
      }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import AccountingFigures from "@/components/AccountingFigures.vue";
import { type ShiftReport, useAccountingStore } from "@/stores/accounting";
import { OrderStatus } from "@/utils/constant";
import { formatDate, formatPrice, formatTime } from "@/utils/format";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

// Mounted afresh on each opening (keyed by the parent), so no manual reset.
const props = defineProps<{ restaurantPk: string; shiftPk: string }>();
const emit = defineEmits<{ close: [] }>();

const accountingStore = useAccountingStore();
const { t } = useI18n();

const report = ref<ShiftReport | null>(null);
const isLoading = ref(true);
const error = ref("");

const title = computed(() =>
  report.value
    ? t("accounting.shiftOf", { date: formatDate(report.value.start) })
    : t("accounting.shift"),
);

onMounted(async () => {
  try {
    report.value = await accountingStore.loadShift(
      props.restaurantPk,
      props.shiftPk,
    );
  } catch {
    error.value = t("accounting.shiftLoadError");
  } finally {
    isLoading.value = false;
  }
});
</script>
