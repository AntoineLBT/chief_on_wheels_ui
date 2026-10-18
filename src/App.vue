<template>
  <RouterView />
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import { load } from "./services/cache";
import { useRestaurantStore } from "./stores/restaurant";
import { useSyncStore } from "./stores/sync";

const authStore = useAuthStore();
const syncStore = useSyncStore();
const restaurantStore = useRestaurantStore();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await syncStore.refreshPendingCount();
    if (navigator.onLine) {
      await load();
      await restaurantStore.loadRestaurants();
    }
  }
});
</script>
