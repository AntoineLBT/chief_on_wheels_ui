<template>
  <v-card
    prepend-icon="mdi-delete-outline"
    :title="`Delete ${restaurant.name}?`"
  >
    <v-form @submit.prevent="onDelete">
      <v-card-text>
        <p class="mb-4">
          Its shifts, orders, recipes, ingredients and fixed charges are deleted
          for good, on the server and on this device.
        </p>
        <v-alert
          v-if="unsyncedShiftCount"
          type="error"
          variant="tonal"
          class="mb-4"
          :text="`${unsyncedShiftCount} shift(s) of this restaurant are not synced: they will be lost.`"
        ></v-alert>
        <v-text-field
          v-model="confirmation"
          :label="`Type “${restaurant.name}” to confirm`"
          autofocus
        ></v-text-field>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          :text="error"
        ></v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="emit('close')">Cancel</v-btn>
        <v-btn
          type="submit"
          color="error"
          variant="tonal"
          :disabled="!isConfirmed"
          :loading="isDeleting"
          >Delete</v-btn
        >
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import type { Restaurant } from "@/services/db";
import { useRestaurantStore } from "@/stores/restaurant";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

// Mounted afresh on each opening (keyed by the parent), so no manual reset.
const props = defineProps<{ restaurant: Restaurant }>();
const emit = defineEmits<{ close: [] }>();

const restaurantStore = useRestaurantStore();
const router = useRouter();

const unsyncedShiftCount = ref(0);
const confirmation = ref("");
const isDeleting = ref(false);
const error = ref("");

const isConfirmed = computed(
  () => confirmation.value.trim() === props.restaurant.name,
);

onMounted(async () => {
  unsyncedShiftCount.value = await restaurantStore.unsyncedShiftCount(
    props.restaurant.pk,
  );
});

async function onDelete() {
  if (!isConfirmed.value) return;
  isDeleting.value = true;
  error.value = "";
  try {
    await restaurantStore.remove(props.restaurant.pk);
    emit("close");
    // "/" falls back on the empty screen: the last opened restaurant is gone.
    router.push("/");
  } catch {
    error.value = "Could not delete the restaurant. Check your connection.";
  } finally {
    isDeleting.value = false;
  }
}
</script>
