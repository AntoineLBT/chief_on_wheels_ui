<template>
  <v-card
    :prepend-icon="charge ? 'mdi-pencil-outline' : 'mdi-plus'"
    :title="charge ? 'Edit fixed charge' : 'New fixed charge'"
  >
    <v-form v-model="isValid" @submit.prevent="onSubmit">
      <v-card-text>
        <v-text-field
          v-model="form.name"
          label="Name"
          :rules="[rules.required]"
          autofocus
        ></v-text-field>
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model.number="form.amount"
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              suffix="€"
              :rules="[rules.required, rules.aboveZero]"
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-select
              v-model="form.frequency"
              label="Frequency"
              :items="frequencyItems"
            ></v-select>
          </v-col>
        </v-row>

        <v-text-field
          v-if="!charge"
          v-model="form.date"
          label="Applies from"
          type="date"
          :rules="[rules.required]"
        ></v-text-field>
        <template v-else-if="isRevised">
          <v-text-field
            v-model="form.date"
            label="New amount applies from"
            type="date"
            :min="dayAfter(charge.start_date)"
            :rules="[rules.required, rules.afterStart]"
          ></v-text-field>
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            text="The current amount stays in the accounting until the day before."
          ></v-alert>
        </template>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-4"
          :text="error"
        ></v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="emit('close')">Cancel</v-btn>
        <v-btn
          type="submit"
          color="primary"
          variant="tonal"
          :disabled="!isValid"
          :loading="isSubmitting"
          >{{ charge ? "Save" : "Create" }}</v-btn
        >
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import { type FixedCharge, useFixedChargeStore } from "@/stores/fixedCharge";
import {
  FixedChargeFrequency,
  fixedChargeFrequencyLabels,
} from "@/utils/constant";
import { localIsoDate } from "@/utils/date";
import { isAxiosError } from "axios";
import { computed, reactive, ref } from "vue";

// Mounted afresh on each opening (keyed by the parent), so no manual reset.
const props = defineProps<{
  restaurantPk: string;
  charge: FixedCharge | null;
}>();
const emit = defineEmits<{ close: [] }>();

const fixedChargeStore = useFixedChargeStore();

const frequencyItems = Object.values(FixedChargeFrequency).map((value) => ({
  value,
  title: fixedChargeFrequencyLabels[value],
}));

function dayAfter(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return localIsoDate(date);
}

// v-model.number yields "" for an empty number field.
type NumberField = number | "";

const rules = {
  required: (value: NumberField | string) =>
    (value !== "" && String(value).trim() !== "") || "Required.",
  aboveZero: (value: NumberField) => Number(value) > 0 || "Must be above 0.",
  // ISO dates compare as strings.
  afterStart: (value: string) =>
    value > props.charge!.start_date ||
    "Must be after the start of the charge.",
};

const form = reactive({
  name: props.charge?.name ?? "",
  amount: (props.charge?.amount ?? "") as NumberField,
  frequency: props.charge?.frequency ?? FixedChargeFrequency.monthly,
  // start_date of a new charge, effective date of a revision.
  date: localIsoDate(),
});
const isValid = ref(false);
const isSubmitting = ref(false);
const error = ref("");

// Amount and frequency open a new period; the name is changed in place.
const isRevised = computed(
  () =>
    !!props.charge &&
    (Number(form.amount) !== props.charge.amount ||
      form.frequency !== props.charge.frequency),
);

async function save() {
  const name = form.name.trim();
  const amount = Number(form.amount);
  if (!props.charge) {
    await fixedChargeStore.create(props.restaurantPk, {
      name,
      amount,
      frequency: form.frequency,
      start_date: form.date,
    });
    return;
  }
  // Rename first: the successor of a revision copies the current name.
  if (name !== props.charge.name) {
    await fixedChargeStore.rename(props.charge.pk, name);
  }
  if (isRevised.value) {
    await fixedChargeStore.revise(props.charge.pk, {
      amount,
      frequency: form.frequency,
      effective_date: form.date,
    });
  }
}

async function onSubmit() {
  if (!isValid.value) return;
  isSubmitting.value = true;
  error.value = "";
  try {
    await save();
    emit("close");
  } catch (e) {
    const data = isAxiosError(e) ? e.response?.data : undefined;
    error.value =
      data?.effective_date?.[0] ??
      data?.detail ??
      "Could not save the fixed charge. Check your connection.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>
