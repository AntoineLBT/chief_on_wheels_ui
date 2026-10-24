<template>
  <!-- Full screen: outside the layout with the restaurant sidebar. -->
  <v-layout>
    <v-app-bar color="primary" elevation="2">
      <template #prepend>
        <v-btn
          icon="mdi-arrow-left"
          :to="restaurantUrl"
          :title="t('shift.back')"
        ></v-btn>
      </template>
      <v-app-bar-title>
        {{ restaurant?.name }}
        <span v-if="shift" class="text-body-2 ms-2">{{
          t("shift.since", { time: formatTime(shift.date) })
        }}</span>
      </v-app-bar-title>

      <template #append>
        <v-chip
          v-if="!isOnline"
          color="warning"
          prepend-icon="mdi-wifi-off"
          class="me-2"
          >{{ t("common.offline") }}</v-chip
        >
        <v-btn
          prepend-icon="mdi-stop-circle-outline"
          variant="flat"
          color="white"
          class="me-2"
          @click="isEndOpen = true"
          >{{ t("shift.end") }}</v-btn
        >
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <KanbanBoard :shift-pk="shiftPk"></KanbanBoard>
      </v-container>
    </v-main>
  </v-layout>

  <v-dialog v-model="isEndOpen" max-width="500">
    <v-card prepend-icon="mdi-stop-circle-outline" :title="t('shift.endTitle')">
      <v-card-text>
        <p>{{ t("shift.endHint") }}</p>
        <v-alert
          v-if="unfinishedCount"
          type="warning"
          variant="tonal"
          class="mt-4"
          :text="t('shift.unfinished', unfinishedCount)"
        ></v-alert>
      </v-card-text>
      <v-card-actions class="flex-wrap">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="isEndOpen = false">{{
          t("common.cancel")
        }}</v-btn>
        <v-btn
          :variant="unfinishedCount ? 'text' : 'tonal'"
          color="error"
          :loading="isEnding"
          @click="onEnd(false)"
          >{{ unfinishedCount ? t("shift.endAsIs") : t("shift.end") }}</v-btn
        >
        <v-btn
          v-if="unfinishedCount"
          variant="tonal"
          color="error"
          :loading="isEnding"
          @click="onEnd(true)"
          >{{ t("shift.markAllDone") }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import KanbanBoard from "@/components/KanbanBoard.vue";
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import { type Restaurant, type Shift, db } from "@/services/db";
import { useOrderStore } from "@/stores/order";
import { useShiftStore } from "@/stores/shift";
import { useSyncStore } from "@/stores/sync";
import { OrderStatus } from "@/utils/constant";
import { formatTime } from "@/utils/format";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

// The route guard only lets the open shift of this restaurant through.
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const restaurantPk = String(route.params.restaurantId);
const shiftPk = String(route.params.shiftId);
const restaurantUrl = `/restaurants/${restaurantPk}`;

const shiftStore = useShiftStore();
const orderStore = useOrderStore();
const syncStore = useSyncStore();
const { isOnline } = useOnlineStatus();

const restaurant = ref<Restaurant>();
const shift = ref<Shift>();

// The board loads the orders of this shift into the order store.
const unfinishedCount = computed(
  () =>
    orderStore.orders.filter(
      (o) => o.shift === shiftPk && o.status !== OrderStatus.done,
    ).length,
);

const isEndOpen = ref(false);
const isEnding = ref(false);

async function onEnd(markAllDone: boolean) {
  isEnding.value = true;
  try {
    await shiftStore.endShift(shiftPk, { markAllDone });
    await syncStore.refreshPendingCount();
    router.push(restaurantUrl);
  } finally {
    isEnding.value = false;
  }
}

onMounted(async () => {
  restaurant.value = await db.restaurants.get(restaurantPk);
  shift.value = await shiftStore.getShift(shiftPk);
});
</script>
