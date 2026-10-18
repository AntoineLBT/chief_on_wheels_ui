<template>
  <AppLayout>
    <v-tabs color="primary" grow>
      <v-tab
        v-for="tab in tabs"
        :key="tab.name"
        :to="{ name: tab.name }"
        :prepend-icon="tab.icon"
        >{{ tab.label }}</v-tab
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

const tabs = [
  {
    name: "restaurant-ingredients",
    label: "Ingredients",
    icon: "mdi-food-apple-outline",
  },
  { name: "restaurant-recipes", label: "Recipes", icon: "mdi-pizza" },
  {
    name: "restaurant-accounting",
    label: "Accounting",
    icon: "mdi-chart-line",
  },
  { name: "restaurant-settings", label: "Settings", icon: "mdi-cog-outline" },
];
</script>
