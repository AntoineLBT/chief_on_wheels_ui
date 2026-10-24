<template>
  <!-- The four amount cells shared by month and shift rows. -->
  <td class="text-right">{{ formatPrice(figures.revenue_excl_vat) }}</td>
  <td class="text-right">{{ formatPrice(figures.material_cost) }}</td>
  <td class="text-right">{{ formatPrice(figures.fixed_charges) }}</td>
  <td class="text-right" :class="{ 'text-error': figures.profit < 0 }">
    {{ formatPrice(figures.profit) }}
  </td>
</template>

<script setup lang="ts">
import type { Figures } from "@/stores/accounting";
import { formatPrice } from "@/utils/format";

defineProps<{ figures: Figures }>();
</script>
