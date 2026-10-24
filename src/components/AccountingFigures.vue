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

const props = defineProps<{ figures: Figures }>();

const kpis = computed(() => [
  {
    label: "Revenue excl. VAT",
    value: props.figures.revenue_excl_vat,
    hint: `${formatPrice(props.figures.revenue_incl_vat)} incl. VAT`,
    color: undefined,
  },
  {
    label: "Material cost",
    value: props.figures.material_cost,
    hint: `${props.figures.order_count} order(s)`,
    color: undefined,
  },
  {
    label: "Fixed charges",
    value: props.figures.fixed_charges,
    hint: `${props.figures.shift_count} shift(s)`,
    color: undefined,
  },
  {
    label: "Profit",
    value: props.figures.profit,
    hint: "",
    color: props.figures.profit < 0 ? "error" : "success",
  },
]);
</script>
