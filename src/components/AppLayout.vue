<template>
  <v-layout>
  <v-app-bar color="primary" elevation="2">
    <v-app-bar-title>
      <v-icon icon="mdi-chef-hat" class="me-2"></v-icon>
      {{ restaurantStore.restaurant?.name ?? "Chief on Wheels" }}
    </v-app-bar-title>

    <template #append>
      <v-chip
        v-if="!isOnline"
        color="warning"
        prepend-icon="mdi-wifi-off"
        class="me-2"
      >
        Offline
      </v-chip>
      <v-btn
        v-if="isOnline"
        :disabled="!syncStore.pendingCount || syncStore.isSyncing"
        :loading="syncStore.isSyncing"
        prepend-icon="mdi-cloud-upload-outline"
        variant="tonal"
        class="me-2"
        @click="syncStore.syncAll"
      >
        Sync
        <v-badge
          v-if="syncStore.pendingCount"
          :content="syncStore.pendingCount"
          color="error"
          floating
        ></v-badge>
      </v-btn>
      <v-btn icon="mdi-logout" @click="onLogout"></v-btn>
    </template>
  </v-app-bar>

  <v-main>
    <slot />
  </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import { useAuthStore } from "@/stores/auth";
import { useRestaurantStore } from "@/stores/restaurant";
import { useSyncStore } from "@/stores/sync";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const restaurantStore = useRestaurantStore();
const syncStore = useSyncStore();
const router = useRouter();
const { isOnline } = useOnlineStatus();

function onLogout() {
  authStore.logout();
  router.push("/login");
}
</script>
