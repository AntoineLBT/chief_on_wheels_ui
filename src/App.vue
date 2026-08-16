<template>
  <RouterView />
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import { useRestaurantStore } from "./stores/restaurant";
import { load } from "./services/cache";
import { useSyncStore } from "./stores/sync";

const authStore = useAuthStore();
const restaurantStore = useRestaurantStore();
const syncStore = useSyncStore();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await syncStore.refreshPendingCount();
    if (navigator.onLine) {
      await restaurantStore.loadRestaurant();
      await load(restaurantStore.restaurant!.pk);
    }
  }
});
</script>
