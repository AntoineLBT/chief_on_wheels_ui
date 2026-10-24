<template>
  <v-card class="d-flex flex-column" height="100%">
    <v-form
      v-model="isValid"
      class="d-flex flex-column fill-height"
      @submit.prevent="onSubmit"
    >
      <v-toolbar color="surface" border="b">
        <v-btn icon="mdi-close" @click="emit('close')"></v-btn>
        <v-toolbar-title>{{
          recipe ? "Edit recipe" : "New recipe"
        }}</v-toolbar-title>
      </v-toolbar>

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <v-text-field
          v-model="name"
          label="Name"
          :rules="[rules.required]"
          autofocus
        ></v-text-field>

        <v-alert
          v-if="!ingredients.length"
          type="info"
          variant="tonal"
          text="Add ingredients in the Ingredients tab first."
        ></v-alert>
        <template v-else>
          <v-text-field
            v-model="filter"
            label="Filter ingredients"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            clearable
          ></v-text-field>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th style="width: 180px">Quantity</th>
                <th class="text-right" style="width: 120px">Cost</th>
              </tr>
            </thead>
            <tbody>
              <!-- v-show, not a filtered v-for: hidden rows keep their quantity
                   and their validation. -->
              <tr
                v-for="ingredient in ingredients"
                v-show="matchesFilter(ingredient)"
                :key="ingredient.pk"
              >
                <td>{{ ingredient.name }}</td>
                <td>
                  <v-text-field
                    v-model.number="quantities[ingredient.pk]"
                    type="number"
                    min="1"
                    step="1"
                    density="compact"
                    variant="outlined"
                    hide-details="auto"
                    :suffix="ingredientBaseUnitLabels[ingredient.unit]"
                    :rules="[rules.optionalPositiveInteger]"
                  ></v-text-field>
                </td>
                <td class="text-right">
                  {{
                    hasQuantity(ingredient.pk)
                      ? formatPrice(
                          ingredientCost(
                            ingredient,
                            Number(quantities[ingredient.pk]),
                          ),
                        )
                      : ""
                  }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>

      <v-divider></v-divider>
      <div class="d-flex flex-wrap align-center ga-6 pa-4">
        <v-text-field
          v-model.number="price"
          label="Price"
          type="number"
          min="0"
          step="0.01"
          suffix="€"
          density="compact"
          hide-details="auto"
          style="max-width: 160px"
          :rules="[rules.required, rules.positive]"
        ></v-text-field>
        <div>
          <div class="text-caption">Cost</div>
          <div class="text-subtitle-1">{{ formatPrice(cost) }}</div>
        </div>
        <div>
          <div class="text-caption">Margin</div>
          <div class="text-subtitle-1">
            {{ formatPrice(recipeMargin(numericPrice, cost)) }}
          </div>
        </div>
        <div>
          <div class="text-caption">Coefficient</div>
          <div class="text-subtitle-1">
            {{ formatCoefficient(recipeCoefficient(numericPrice, cost)) }}
          </div>
        </div>
        <v-switch
          v-model="isActive"
          label="Active"
          color="primary"
          hide-details
        ></v-switch>
        <v-spacer></v-spacer>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          :text="error"
        ></v-alert>
        <v-btn variant="text" @click="emit('close')">Cancel</v-btn>
        <v-btn
          type="submit"
          color="primary"
          variant="tonal"
          :disabled="!isValid"
          :loading="isSubmitting"
          >{{ recipe ? "Save" : "Create" }}</v-btn
        >
      </div>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import type { Ingredient, Recipe } from "@/services/db";
import { useIngredientStore } from "@/stores/ingredient";
import { useRecipeStore } from "@/stores/recipe";
import { useRecipeIngredientStore } from "@/stores/recipeIngredient";
import { ingredientBaseUnitLabels } from "@/utils/constant";
import {
  ingredientCost,
  recipeCoefficient,
  recipeCost,
  recipeMargin,
} from "@/utils/cost";
import { formatCoefficient, formatPrice } from "@/utils/format";
import { computed, reactive, ref } from "vue";

// Mounted afresh on each opening (keyed by the parent), so no manual reset.
const props = defineProps<{
  restaurantPk: string;
  recipe: Recipe | null;
}>();
const emit = defineEmits<{ close: [] }>();

const recipeStore = useRecipeStore();
const ingredientStore = useIngredientStore();
const recipeIngredientStore = useRecipeIngredientStore();

// v-model.number yields "" for an empty number field.
type NumberField = number | "";
const isEmpty = (value: NumberField | string | null | undefined) =>
  value === "" ||
  value === null ||
  value === undefined ||
  (typeof value === "string" && !value.trim());

const rules = {
  required: (value: NumberField | string) => !isEmpty(value) || "Required.",
  positive: (value: NumberField) => Number(value) >= 0 || "Must be positive.",
  optionalPositiveInteger: (value: NumberField) =>
    isEmpty(value) ||
    (Number.isInteger(value) && Number(value) > 0) ||
    "Whole number above 0.",
};

const ingredients = computed(() =>
  [...ingredientStore.ingredients].sort((a, b) => a.name.localeCompare(b.name)),
);
const ingredientsByPk = computed(
  () => new Map(ingredientStore.ingredients.map((i) => [i.pk, i])),
);

const name = ref(props.recipe?.name ?? "");
const price = ref<NumberField>(props.recipe?.price ?? "");
const isActive = ref(props.recipe?.is_active ?? true);
// An empty quantity means the ingredient is not in the recipe.
const quantities = reactive<Record<string, NumberField>>(
  Object.fromEntries(
    recipeIngredientStore.recipeIngredients
      .filter((line) => line.recipe === props.recipe?.pk)
      .map((line) => [line.ingredient, line.quantity]),
  ),
);
const filter = ref<string | null>("");
const isValid = ref(false);
const isSubmitting = ref(false);
const error = ref("");

function matchesFilter(ingredient: Ingredient) {
  return ingredient.name
    .toLowerCase()
    .includes((filter.value ?? "").trim().toLowerCase());
}

function hasQuantity(ingredientPk: string) {
  const quantity = quantities[ingredientPk];
  return !isEmpty(quantity) && Number(quantity) > 0;
}

const lines = computed(() =>
  Object.keys(quantities)
    .filter(hasQuantity)
    .map((ingredient) => ({
      ingredient,
      quantity: Number(quantities[ingredient]),
    })),
);
const cost = computed(() => recipeCost(lines.value, ingredientsByPk.value));
const numericPrice = computed(() => Number(price.value) || 0);

async function onSubmit() {
  if (!isValid.value) return;
  isSubmitting.value = true;
  error.value = "";
  const input = {
    name: name.value.trim(),
    price: Number(price.value),
    is_active: isActive.value,
    recipe_ingredients: lines.value,
  };
  try {
    if (props.recipe) {
      await recipeStore.update(props.recipe.pk, input);
    } else {
      await recipeStore.create(props.restaurantPk, input);
    }
    emit("close");
  } catch {
    error.value = "Could not save the recipe. Check your connection.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>
