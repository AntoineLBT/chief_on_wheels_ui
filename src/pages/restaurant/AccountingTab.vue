<template>
  <div class="d-flex align-center flex-wrap ga-2 mb-4">
    <div class="text-h6">{{ t("accounting.title") }}</div>
    <v-spacer></v-spacer>
    <v-btn-toggle
      v-model="period"
      mandatory
      density="comfortable"
      variant="outlined"
      color="primary"
    >
      <v-btn value="year">{{ t("accounting.year") }}</v-btn>
      <v-btn value="month">{{ t("accounting.month") }}</v-btn>
      <v-btn value="week">{{ t("accounting.week") }}</v-btn>
    </v-btn-toggle>
    <div class="d-flex align-center">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        @click="date = stepPeriod(period, date, -1)"
      ></v-btn>
      <div class="text-subtitle-1 text-center" style="min-width: 12rem">
        {{ periodLabel }}
      </div>
      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        @click="date = stepPeriod(period, date, 1)"
      ></v-btn>
      <v-btn variant="text" @click="date = localIsoDate()">{{
        t("common.today")
      }}</v-btn>
    </div>
  </div>

  <v-alert
    v-if="unsyncedShiftCount"
    type="warning"
    variant="tonal"
    density="compact"
    class="mb-4"
    :text="t('accounting.unsynced', unsyncedShiftCount)"
  ></v-alert>

  <v-empty-state
    v-if="!isOnline"
    icon="mdi-wifi-off"
    :title="t('accounting.onlineOnly')"
  ></v-empty-state>

  <v-alert v-else-if="error" type="error" variant="tonal" :text="error">
  </v-alert>

  <div v-else-if="isLoading" class="d-flex justify-center pa-8">
    <v-progress-circular indeterminate></v-progress-circular>
  </div>

  <template v-else-if="report">
    <template v-if="report.period === 'year'">
      <div class="text-subtitle-2 mb-2">{{ t("accounting.toDate") }}</div>
      <AccountingFigures :figures="report.to_date"></AccountingFigures>
      <div class="text-subtitle-2 mt-4 mb-2">
        {{ t("accounting.wholeYear") }}
      </div>
    </template>
    <AccountingFigures :figures="report.totals"></AccountingFigures>

    <v-table class="mt-6" hover>
      <thead>
        <tr>
          <th>
            {{
              report.period === "year"
                ? t("accounting.month")
                : t("accounting.shift")
            }}
          </th>
          <th class="text-right">{{ t("accounting.revenueExclVat") }}</th>
          <th class="text-right">{{ t("accounting.materialCost") }}</th>
          <th class="text-right">{{ t("accounting.fixedCharges") }}</th>
          <th class="text-right">{{ t("accounting.profit") }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="report.period === 'year'">
          <tr
            v-for="month in report.breakdown"
            :key="month.start"
            :class="{ 'text-disabled': month.status === 'future' }"
            style="cursor: pointer"
            @click="openMonth(month.start)"
          >
            <td>
              {{ formatMonth(month.start) }}
              <v-chip
                v-if="month.status === 'current'"
                size="x-small"
                color="primary"
                class="ml-2"
                >{{ t("accounting.current") }}</v-chip
              >
            </td>
            <FiguresCells :figures="month"></FiguresCells>
          </tr>
        </template>
        <template v-else>
          <tr
            v-for="row in report.breakdown"
            :key="row.shift ?? 'unallocated'"
            :style="row.shift ? 'cursor: pointer' : ''"
            @click="row.shift && openShift(row.shift)"
          >
            <td>
              {{
                row.date ? formatDate(row.date) : t("accounting.withoutShift")
              }}
            </td>
            <FiguresCells :figures="row"></FiguresCells>
          </tr>
          <tr v-if="!report.breakdown.length">
            <td colspan="5" class="text-center text-medium-emphasis">
              {{ t("accounting.noShift") }}
            </td>
          </tr>
        </template>
      </tbody>
    </v-table>
  </template>

  <v-dialog v-model="isShiftOpen" max-width="700">
    <ShiftAccountingDialog
      v-if="selectedShift"
      :key="selectedShift"
      :restaurant-pk="restaurantPk"
      :shift-pk="selectedShift"
      @close="isShiftOpen = false"
    ></ShiftAccountingDialog>
  </v-dialog>
</template>

<script setup lang="ts">
import AccountingFigures from "@/components/AccountingFigures.vue";
import FiguresCells from "@/components/FiguresCells.vue";
import ShiftAccountingDialog from "@/components/ShiftAccountingDialog.vue";
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import { useAccountingStore } from "@/stores/accounting";
import { useRestaurantStore } from "@/stores/restaurant";
import { useSyncStore } from "@/stores/sync";
import { localIsoDate } from "@/utils/date";
import { formatDate, formatMonth } from "@/utils/format";
import { type Period, periodRange, stepPeriod } from "@/utils/period";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const route = useRoute();
const accountingStore = useAccountingStore();
const restaurantStore = useRestaurantStore();
const syncStore = useSyncStore();
const { t } = useI18n();
const { isOnline } = useOnlineStatus();

const restaurantPk = computed(() => String(route.params.restaurantId));
const period = ref<Period>("month");
const date = ref(localIsoDate());

const report = computed(() => accountingStore.report);
const isLoading = ref(false);
const error = ref("");

// The accounting only sees synced shifts: say how many are missing.
const unsyncedShiftCount = ref(0);

// pendingCount drops after a sync: refresh the banner and the figures.
const pendingCount = computed(() => syncStore.pendingCount);

watch(
  [restaurantPk, pendingCount],
  async ([pk]) => {
    unsyncedShiftCount.value = await restaurantStore.unsyncedShiftCount(pk);
  },
  { immediate: true },
);

watch(
  [restaurantPk, period, date, isOnline, pendingCount],
  async ([pk, currentPeriod, currentDate, online]) => {
    accountingStore.report = null;
    error.value = "";
    if (!online) return;
    isLoading.value = true;
    try {
      await accountingStore.load(pk, currentPeriod, currentDate);
    } catch {
      error.value = t("accounting.loadError");
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true },
);

const periodLabel = computed(() => {
  const { start, end } = periodRange(period.value, date.value);
  if (period.value === "year") return start.slice(0, 4);
  if (period.value === "month") return formatMonth(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
});

function openMonth(start: string) {
  period.value = "month";
  date.value = start;
}

const isShiftOpen = ref(false);
const selectedShift = ref<string | null>(null);

function openShift(shiftPk: string) {
  selectedShift.value = shiftPk;
  isShiftOpen.value = true;
}
</script>
