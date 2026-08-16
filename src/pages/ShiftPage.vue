<template>
  <v-container>
    <v-row class="justify-end">
      <v-col cols="10"
        ><h1 v-if="shift">
          {{ new Date(shift.date).toDateString() }}
        </h1></v-col
      >
      <v-col cols="2">
        <v-btn
          v-if="!shift?.ended_at"
          prepend-icon="mdi-stop-circle-outline"
          @click="onEndShift"
          >End shift</v-btn
        >
        <v-btn
          v-else
          prepend-icon="mdi-backburger"
          @click="() => router.push('/shift')"
          >Go back</v-btn
        >
      </v-col></v-row
    >
    <KanbanBoard v-if="shift" :shift-pk="shift!.pk"></KanbanBoard>
  </v-container>
</template>
<script setup lang="ts">
import KanbanBoard from "@/components/KanbanBoard.vue";
import { useShiftStore } from "@/stores/shift";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { type Shift } from "../services/db";
import { useSyncStore } from "@/stores/sync";

const shiftStore = useShiftStore();
const router = useRouter();
const syncStore = useSyncStore();

const pk = useRoute().params.pk as string;
const shift = ref<Shift>();

async function onEndShift() {
  if (shift.value) {
    await shiftStore.endShift(shift.value.pk);
    await syncStore.refreshPendingCount();
    router.push("/shift");
  }
}

onMounted(async () => {
  shift.value = await shiftStore.getShift(pk);
});
</script>
