<template>
  <v-card
    :prepend-icon="ingredient ? 'mdi-pencil-outline' : 'mdi-plus'"
    :title="ingredient ? 'Edit ingredient' : 'New ingredient'"
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
          <v-col cols="5">
            <v-select
              v-model="form.unit"
              label="Sold by"
              :items="unitItems"
            ></v-select>
          </v-col>
          <v-col cols="7">
            <v-text-field
              v-model.number="form.price_per_unit"
              label="Price"
              type="number"
              min="0"
              step="0.01"
              :suffix="`€ / ${ingredientUnitLabels[form.unit]}`"
              :rules="[rules.required, rules.positive]"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-checkbox
          v-model="form.has_extra"
          label="Available as a paid extra"
          hide-details
        ></v-checkbox>
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model.number="form.extra_price"
              label="Extra price"
              type="number"
              min="0"
              step="0.01"
              suffix="€"
              :disabled="!form.has_extra"
              :rules="form.has_extra ? [rules.required, rules.positive] : []"
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="form.extra_quantity"
              label="Extra portion"
              type="number"
              min="1"
              step="1"
              :suffix="ingredientBaseUnitLabels[form.unit]"
              :disabled="!form.has_extra"
              :rules="
                form.has_extra ? [rules.required, rules.positiveInteger] : []
              "
            ></v-text-field>
          </v-col>
        </v-row>

        <v-alert v-if="error" type="error" variant="tonal" :text="error">
        </v-alert>
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
          >{{ ingredient ? "Save" : "Create" }}</v-btn
        >
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import type { Ingredient } from "@/services/db";
import { type IngredientInput, useIngredientStore } from "@/stores/ingredient";
import {
  IngredientUnit,
  ingredientBaseUnitLabels,
  ingredientUnitLabels,
} from "@/utils/constant";
import { reactive, ref } from "vue";

// Mounted afresh on each opening (keyed by the parent), so no manual reset.
const props = defineProps<{
  restaurantPk: string;
  ingredient: Ingredient | null;
}>();
const emit = defineEmits<{ close: [] }>();

const ingredientStore = useIngredientStore();

const unitItems = Object.values(IngredientUnit).map((unit) => ({
  value: unit,
  title: ingredientUnitLabels[unit],
}));

// v-model.number yields "" for an empty number field.
type NumberField = number | "" | null;
const isEmpty = (value: NumberField | string) =>
  value === "" ||
  value === null ||
  (typeof value === "string" && !value.trim());

const rules = {
  required: (value: NumberField | string) => !isEmpty(value) || "Required.",
  positive: (value: NumberField) => Number(value) >= 0 || "Must be positive.",
  positiveInteger: (value: NumberField) =>
    (Number.isInteger(value) && Number(value) > 0) ||
    "Must be a whole number above 0.",
};

const form = reactive({
  name: props.ingredient?.name ?? "",
  unit: props.ingredient?.unit ?? IngredientUnit.kg,
  price_per_unit: (props.ingredient?.price_per_unit ?? "") as NumberField,
  has_extra: props.ingredient?.has_extra ?? false,
  extra_price: (props.ingredient?.extra_price ?? "") as NumberField,
  extra_quantity: (props.ingredient?.extra_quantity ?? "") as NumberField,
});
const isValid = ref(false);
const isSubmitting = ref(false);
const error = ref("");

function toInput(): IngredientInput {
  const extra = (value: NumberField) =>
    form.has_extra && !isEmpty(value) ? Number(value) : null;
  return {
    name: form.name.trim(),
    unit: form.unit,
    price_per_unit: Number(form.price_per_unit),
    has_extra: form.has_extra,
    extra_price: extra(form.extra_price),
    extra_quantity: extra(form.extra_quantity),
  };
}

async function onSubmit() {
  if (!isValid.value) return;
  isSubmitting.value = true;
  error.value = "";
  try {
    if (props.ingredient) {
      await ingredientStore.update(props.ingredient.pk, toInput());
    } else {
      await ingredientStore.create(props.restaurantPk, toInput());
    }
    emit("close");
  } catch {
    error.value = "Could not save the ingredient. Check your connection.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>
