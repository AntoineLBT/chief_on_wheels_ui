<template>
  <AppLayout>
    <v-container>
      <v-row class="align-center mb-2">
        <v-col>
          <h1 v-if="shift" class="text-h5">
            {{ new Date(shift.date).toLocaleDateString() }}
            <v-chip
              v-if="!shift.ended_at"
              color="success"
              size="small"
              class="ms-2"
              >Active</v-chip
            >
            <v-chip v-else size="small" class="ms-2">Closed</v-chip>
          </h1>
        </v-col>
        <v-col cols="auto">
          <v-btn
            v-if="!shift?.ended_at"
            prepend-icon="mdi-stop-circle-outline"
            color="error"
            variant="tonal"
            @click="onEndShift"
            >End shift</v-btn
          >
          <v-btn
            v-else
            prepend-icon="mdi-arrow-left"
            variant="tonal"
            @click="() => router.push('/shift')"
            >Back</v-btn
          >
        </v-col>
      </v-row>
      <KanbanBoard v-if="shift" :shift-pk="shift.pk"></KanbanBoard>
    </v-container>
  </AppLayout>
</template>
<script setup lang="ts">
import AppLayout from "@/components/AppLayout.vue";
import KanbanBoard from "@/components/KanbanBoard.vue";
import { useShiftStore } from "@/stores/shift";
import { useSyncStore } from "@/stores/sync";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { type Shift } from "../services/db";

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
