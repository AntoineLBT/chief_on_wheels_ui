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

        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn icon="mdi-cog" v-bind="menuProps"></v-btn>
          </template>
          <v-list>
            <v-list-subheader>Font size</v-list-subheader>
            <v-list-item
              v-for="option in fontSizeOptions"
              :key="option.value"
              :title="option.label"
              :prepend-icon="option.icon"
              :active="fontSize === option.value"
              active-color="primary"
              @click="setFontSize(option.value)"
            ></v-list-item>
            <v-divider></v-divider>
            <v-list-item
              title="Logout"
              prepend-icon="mdi-logout"
              @click="onLogout"
            ></v-list-item>
          </v-list>
        </v-menu>
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
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const restaurantStore = useRestaurantStore();
const syncStore = useSyncStore();
const router = useRouter();
const { isOnline } = useOnlineStatus();

type FontSize = "small" | "medium" | "large";

const fontSizeOptions: { label: string; value: FontSize; icon: string }[] = [
  { label: "Small", value: "small", icon: "mdi-format-font-size-decrease" },
  { label: "Medium", value: "medium", icon: "mdi-format-size" },
  { label: "Large", value: "large", icon: "mdi-format-font-size-increase" },
];

const fontSizeMap: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "20px",
};

const fontSize = ref<FontSize>(
  (localStorage.getItem("fontSize") as FontSize) ?? "medium",
);

function applyFontSize(size: FontSize) {
  document.documentElement.style.setProperty("font-size", fontSizeMap[size]);
}

function setFontSize(size: FontSize) {
  fontSize.value = size;
  localStorage.setItem("fontSize", size);
  applyFontSize(size);
}

function onLogout() {
  authStore.logout();
  router.push("/login");
}

onMounted(() => {
  applyFontSize(fontSize.value);
});
</script>
