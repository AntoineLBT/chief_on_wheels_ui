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
          prepend-icon="mdi-stop-circle-outline"
          @click="onEndShift"
          v-if="!shift?.ended_at"
          >End shift</v-btn
        >
        <v-btn
          prepend-icon="mdi-backburger"
          @click="() => router.push('/shift')"
          v-else
          >Go back</v-btn
        >
      </v-col></v-row
    >
    <v-sheet>KANBAN</v-sheet>
  </v-container>
</template>
<script setup lang="ts">
import { useShiftStore } from "@/stores/shift";
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const shiftStore = useShiftStore();
const router = useRouter();

const pk = useRoute().params.pk as string;
const shift = computed(() => shiftStore.shifts.find((s) => s.pk === pk));

async function onEndShift() {
  if (shift.value) {
    await shiftStore.endShift(shift.value.pk);
    router.push("/shift");
  }
}

onMounted(async () => {
  await shiftStore.load();
});
</script>
