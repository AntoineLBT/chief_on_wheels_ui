<template>
  <AppLayout>
    <v-container>
      <v-alert
        v-if="shiftStore.activeShift"
        type="success"
        variant="tonal"
        icon="mdi-fire"
        class="mb-4"
        :text="`Active shift started on ${new Date(shiftStore.activeShift.date).toLocaleDateString()}`"
        style="cursor: pointer"
        @click="router.push(`/shift/${shiftStore.activeShift.pk}`)"
      >
        <template #append>
          <v-btn variant="tonal" color="success" size="small"> Open </v-btn>
        </template>
      </v-alert>

      <v-row class="align-center mb-2">
        <v-col>
          <span class="text-h6">Shifts</span>
        </v-col>
        <v-col cols="auto">
          <v-btn
            prepend-icon="mdi-plus"
            color="primary"
            :disabled="!!shiftStore.activeShift"
            @click="onCreateShift"
            >New shift</v-btn
          >
        </v-col>
      </v-row>

      <v-card
        v-if="!shiftStore.shifts.length"
        class="text-center pa-8"
        variant="outlined"
      >
        <v-icon
          icon="mdi-chef-hat"
          size="48"
          color="medium-emphasis"
          class="mb-2"
        ></v-icon>
        <div class="text-body-1 text-medium-emphasis">
          No shifts yet. Start your first shift!
        </div>
      </v-card>

      <v-data-table
        v-else
        :items="sortedShifts"
        :headers="headers"
        hover
        @click:row="
          (_: MouseEvent, { item }: { item: Shift }) =>
            router.push(`/shift/${item.pk}`)
        "
      >
        <template #item.ended_at="{ item }">
          <v-chip
            :color="item.ended_at ? 'default' : 'success'"
            size="small"
            variant="tonal"
          >
            {{ item.ended_at ? "Closed" : "Active" }}
          </v-chip>
        </template>
      </v-data-table>
    </v-container>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/components/AppLayout.vue";
import type { Shift } from "@/services/db";
import { useRestaurantStore } from "@/stores/restaurant";
import { useShiftStore } from "@/stores/shift";
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const headers = [
  {
    title: "Date",
    key: "date",
    value: (s: Shift) => new Date(s.date).toLocaleDateString(),
  },
  { title: "Status", key: "ended_at" },
];

const shiftStore = useShiftStore();
const restaurantStore = useRestaurantStore();
// Temporary until the restaurant comes from the URL (plan step 1.6).
const restaurantPk = computed(() => restaurantStore.restaurants[0]?.pk);
const router = useRouter();

const sortedShifts = computed(() =>
  [...shiftStore.shifts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  ),
);

async function onCreateShift() {
  if (!restaurantPk.value) return;
  const newShift = await shiftStore.startShift(restaurantPk.value);
  router.push(`/shift/${newShift.pk}`);
}

onMounted(async () => {
  await restaurantStore.loadRestaurants();
  if (restaurantPk.value) await shiftStore.loadShifts(restaurantPk.value);
});
</script>
