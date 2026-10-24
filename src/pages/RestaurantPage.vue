<template>
  <AppLayout>
    <v-tabs color="primary" grow>
      <v-tab
        v-for="tab in tabs"
        :key="tab.name"
        :to="{ name: tab.name }"
        :prepend-icon="tab.icon"
        >{{ t(tab.labelKey) }}</v-tab
      >
    </v-tabs>
    <v-divider></v-divider>

    <v-container>
      <RouterView />
    </v-container>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/components/AppLayout.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const tabs = [
  {
    name: "restaurant-ingredients",
    labelKey: "restaurant.tabs.ingredients",
    icon: "mdi-food-apple-outline",
  },
  {
    name: "restaurant-recipes",
    labelKey: "restaurant.tabs.recipes",
    icon: "mdi-pizza",
  },
  {
    name: "restaurant-accounting",
    labelKey: "restaurant.tabs.accounting",
    icon: "mdi-chart-line",
  },
  {
    name: "restaurant-settings",
    labelKey: "restaurant.tabs.settings",
    icon: "mdi-cog-outline",
  },
];
</script>
