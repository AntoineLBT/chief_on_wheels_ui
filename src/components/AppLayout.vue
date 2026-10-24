<template>
  <v-layout>
    <v-app-bar color="primary" elevation="2">
      <template #prepend>
        <v-app-bar-nav-icon
          @click="isDrawerOpen = !isDrawerOpen"
        ></v-app-bar-nav-icon>
      </template>
      <v-app-bar-title>
        <v-icon icon="mdi-chef-hat" class="me-2"></v-icon>
        {{ currentRestaurant?.name ?? "Chief on Wheels" }}
      </v-app-bar-title>

      <template #append>
        <v-btn
          v-if="currentRestaurant"
          :prepend-icon="openShift ? 'mdi-truck-fast-outline' : 'mdi-play'"
          variant="flat"
          color="white"
          class="me-2"
          @click="onShift"
          >{{
            openShift ? t("layout.resumeShift") : t("layout.startShift")
          }}</v-btn
        >
        <v-chip
          v-if="!isOnline"
          color="warning"
          prepend-icon="mdi-wifi-off"
          class="me-2"
        >
          {{ t("common.offline") }}
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
          {{ t("layout.sync") }}
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
            <v-list-subheader>{{ t("layout.fontSize") }}</v-list-subheader>
            <v-list-item
              v-for="option in fontSizeOptions"
              :key="option.value"
              :title="t(option.labelKey)"
              :prepend-icon="option.icon"
              :active="fontSize === option.value"
              active-color="primary"
              @click="setFontSize(option.value)"
            ></v-list-item>
            <v-divider></v-divider>
            <v-list-item
              :title="t('layout.logout')"
              prepend-icon="mdi-logout"
              @click="onLogout"
            ></v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="isDrawerOpen">
      <v-list nav>
        <v-list-subheader>{{ t("layout.restaurants") }}</v-list-subheader>
        <v-list-item
          v-for="restaurant in sortedRestaurants"
          :key="restaurant.pk"
          :title="restaurant.name"
          :to="`/restaurants/${restaurant.pk}`"
          prepend-icon="mdi-store-outline"
          color="primary"
        ></v-list-item>
      </v-list>

      <template #append>
        <div class="pa-2">
          <v-btn
            block
            prepend-icon="mdi-plus"
            color="primary"
            variant="tonal"
            :disabled="!isOnline"
            @click="isCreateDialogOpen = true"
            >{{ t("layout.newRestaurant") }}</v-btn
          >
        </div>
      </template>
    </v-navigation-drawer>

    <v-dialog v-model="isCreateDialogOpen" max-width="400">
      <NewRestaurantDialog
        @close="isCreateDialogOpen = false"
      ></NewRestaurantDialog>
    </v-dialog>

    <v-main>
      <slot />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import NewRestaurantDialog from "@/components/NewRestaurantDialog.vue";
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import { useAuthStore } from "@/stores/auth";
import type { Shift } from "@/services/db";
import { useRestaurantStore } from "@/stores/restaurant";
import { ShiftAlreadyOpenError, useShiftStore } from "@/stores/shift";
import { useSyncStore } from "@/stores/sync";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

const authStore = useAuthStore();
const syncStore = useSyncStore();
const restaurantStore = useRestaurantStore();
const router = useRouter();
const route = useRoute();
const { isOnline } = useOnlineStatus();
const { t } = useI18n();

// null lets Vuetify open the drawer on large screens and close it on mobile.
const isDrawerOpen = ref<boolean | null>(null);
const isCreateDialogOpen = ref(false);

const sortedRestaurants = computed(() =>
  [...restaurantStore.restaurants].sort((a, b) => a.name.localeCompare(b.name)),
);

const currentRestaurant = computed(() =>
  restaurantStore.restaurants.find((r) => r.pk === route.params.restaurantId),
);

// Works offline: shifts live in Dexie until they are closed and synced.
const shiftStore = useShiftStore();
const openShift = ref<Shift | null>(null);

watch(
  () => route.params.restaurantId,
  async (restaurantId) => {
    openShift.value =
      typeof restaurantId === "string"
        ? await shiftStore.currentOpenShift(restaurantId)
        : null;
  },
  { immediate: true },
);

async function startOrResumeShift(restaurantPk: string) {
  if (openShift.value) return openShift.value;
  try {
    return await shiftStore.startShift(restaurantPk);
  } catch (error) {
    // Opened meanwhile (another tab): resume it.
    if (error instanceof ShiftAlreadyOpenError) return error.shift;
    throw error;
  }
}

async function onShift() {
  const restaurantPk = currentRestaurant.value!.pk;
  const shift = await startOrResumeShift(restaurantPk);
  router.push(`/restaurants/${restaurantPk}/shifts/${shift.pk}`);
}

type FontSize = "small" | "medium" | "large";

const fontSizeOptions: { labelKey: string; value: FontSize; icon: string }[] = [
  {
    labelKey: "layout.fontSmall",
    value: "small",
    icon: "mdi-format-font-size-decrease",
  },
  { labelKey: "layout.fontMedium", value: "medium", icon: "mdi-format-size" },
  {
    labelKey: "layout.fontLarge",
    value: "large",
    icon: "mdi-format-font-size-increase",
  },
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

onMounted(async () => {
  applyFontSize(fontSize.value);
  await restaurantStore.loadRestaurants();
});
</script>
