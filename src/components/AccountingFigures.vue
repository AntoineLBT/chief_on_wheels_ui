<template>
  <v-row dense>
    <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
      <v-card variant="tonal" :color="kpi.color">
        <v-card-text>
          <div class="text-caption">{{ kpi.label }}</div>
          <div class="text-h6">{{ formatPrice(kpi.value) }}</div>
          <div v-if="kpi.hint" class="text-caption">{{ kpi.hint }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { Figures } from "@/stores/accounting";
import { formatPrice } from "@/utils/format";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{ figures: Figures }>();
const { t } = useI18n();

const kpis = computed(() => [
  {
    label: t("accounting.revenueExclVat"),
    value: props.figures.revenue_excl_vat,
    hint: t("accounting.inclVat", {
      price: formatPrice(props.figures.revenue_incl_vat),
    }),
    color: undefined,
  },
  {
    label: t("accounting.materialCost"),
    value: props.figures.material_cost,
    hint: t("count.orders", props.figures.order_count),
    color: undefined,
  },
  {
    label: t("accounting.fixedCharges"),
    value: props.figures.fixed_charges,
    hint: t("count.shifts", props.figures.shift_count),
    color: undefined,
  },
  {
    label: t("accounting.profit"),
    value: props.figures.profit,
    hint: "",
    color: props.figures.profit < 0 ? "error" : "success",
  },
]);
</script>
