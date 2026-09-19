<template>
  <v-banner v-if="!isOnline" color="warning" icon="mdi-wifi-off">
    You are offline — changes will be saved locally.
  </v-banner>
  <RouterView />
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import { useRestaurantStore } from "./stores/restaurant";
import { load } from "./services/cache";
import { useSyncStore } from "./stores/sync";
import { useOnlineStatus } from "./composables/useOnlineStatus";

const authStore = useAuthStore();
const restaurantStore = useRestaurantStore();
const syncStore = useSyncStore();
const { isOnline } = useOnlineStatus();

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
