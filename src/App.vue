<template>
  <RouterView />
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import { useRestaurantStore } from "./stores/restaurant";
import { load } from "./services/cache";

const authStore = useAuthStore();
const restaurantStore = useRestaurantStore();

onMounted(async () => {
  if (authStore.isAuthenticated && navigator.onLine) {
    await restaurantStore.loadRestaurant();
    await load(restaurantStore.restaurant!.pk);
  }
});
</script>
