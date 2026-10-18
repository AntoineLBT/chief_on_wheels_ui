<template>
  <v-card prepend-icon="mdi-store-plus-outline" title="New restaurant">
    <v-form v-model="isValid" @submit.prevent="onSubmit">
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Name"
          :rules="[rules.required]"
          autofocus
        ></v-text-field>
        <v-alert v-if="error" type="error" variant="tonal" :text="error">
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn
          type="submit"
          color="primary"
          variant="tonal"
          :disabled="!isValid"
          :loading="isSubmitting"
          >Create</v-btn
        >
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import { useRestaurantStore } from "@/stores/restaurant";
import { ref } from "vue";
import { useRouter } from "vue-router";

const emit = defineEmits<{ close: [] }>();

const restaurantStore = useRestaurantStore();
const router = useRouter();

const rules = {
  required: (value: string) => !!value.trim() || "Required.",
};

const name = ref("");
const isValid = ref(false);
const isSubmitting = ref(false);
const error = ref("");

// v-dialog keeps its content mounted between openings: reset by hand.
function close() {
  name.value = "";
  error.value = "";
  emit("close");
}

async function onSubmit() {
  if (!isValid.value) return;
  isSubmitting.value = true;
  error.value = "";
  try {
    const restaurant = await restaurantStore.create(name.value.trim());
    close();
    router.push(`/restaurants/${restaurant.pk}`);
  } catch {
    error.value = "Could not create the restaurant. Check your connection.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>
