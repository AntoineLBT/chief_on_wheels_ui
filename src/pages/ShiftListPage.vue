<template>
  <AppLayout>
    <v-container>
      <v-row class="justify-end mb-2">
        <v-col cols="auto">
          <v-btn
            prepend-icon="mdi-chef-hat"
            color="primary"
            :disabled="!!shiftStore.activeShift"
            @click="onCreateShift"
            >New shift</v-btn
          >
        </v-col>
      </v-row>
      <v-data-table
        :items="shiftStore.shifts"
        :headers="headers"
        @click:row="
          (_: MouseEvent, { item }: { item: Shift }) =>
            router.push(`/shift/${item.pk}`)
        "
      ></v-data-table>
    </v-container>
  </AppLayout>
</template>
<script setup lang="ts">
import AppLayout from "@/components/AppLayout.vue";
import type { Shift } from "@/services/db";
import { useShiftStore } from "@/stores/shift";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const headers = [
  {
    title: "Date",
    key: "date",
    value: (s: Shift) => new Date(s.date).toLocaleDateString(),
  },
  {
    title: "Status",
    key: "ended_at",
    value: (s: Shift) => (s.ended_at ? "Closed" : "Active"),
  },
];

const shiftStore = useShiftStore();
const router = useRouter();

async function onCreateShift() {
  const newShift = await shiftStore.createShift();
  router.push(`/shift/${newShift.pk}`);
}

onMounted(async () => {
  await shiftStore.loadShifts();
});
</script>
