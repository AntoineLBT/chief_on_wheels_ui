<template>
  <RouterView />
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import { load } from "./services/cache";
import { useSyncStore } from "./stores/sync";

const authStore = useAuthStore();
const syncStore = useSyncStore();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await syncStore.refreshPendingCount();
    if (navigator.onLine) {
      await load();
    }
  }
});
</script>
