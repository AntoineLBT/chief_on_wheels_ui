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

    <v-navigation-drawer v-model="isDrawerOpen">
      <v-list nav>
        <v-list-subheader>Restaurants</v-list-subheader>
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
            >New restaurant</v-btn
          >
        </div>
      </template>
    </v-navigation-drawer>

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
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const authStore = useAuthStore();
const syncStore = useSyncStore();
const restaurantStore = useRestaurantStore();
const router = useRouter();
const route = useRoute();
const { isOnline } = useOnlineStatus();

// null lets Vuetify open the drawer on large screens and close it on mobile.
const isDrawerOpen = ref<boolean | null>(null);
// Wired to the creation dialog in plan step 1.8.
const isCreateDialogOpen = ref(false);

const sortedRestaurants = computed(() =>
  [...restaurantStore.restaurants].sort((a, b) => a.name.localeCompare(b.name)),
);

const currentRestaurant = computed(() =>
  restaurantStore.restaurants.find((r) => r.pk === route.params.restaurantId),
);

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

onMounted(async () => {
  applyFontSize(fontSize.value);
  await restaurantStore.loadRestaurants();
});
</script>
