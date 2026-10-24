<template>
  <div class="d-flex align-center mb-4">
    <div class="text-h6">Ingredients</div>
    <v-spacer></v-spacer>
    <v-btn
      color="primary"
      variant="tonal"
      prepend-icon="mdi-plus"
      :disabled="!isOnline"
      @click="openForm(null)"
      >New ingredient</v-btn
    >
  </div>

  <v-alert
    v-if="!isOnline"
    type="info"
    variant="tonal"
    density="compact"
    class="mb-4"
    text="Offline: ingredients are read-only."
  ></v-alert>

  <v-empty-state
    v-if="!sortedIngredients.length"
    icon="mdi-food-apple-outline"
    title="No ingredient yet"
  ></v-empty-state>

  <v-table v-else>
    <thead>
      <tr>
        <th>Name</th>
        <th>Sold by</th>
        <th class="text-right">Price</th>
        <th>Extra</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="ingredient in sortedIngredients" :key="ingredient.pk">
        <td>{{ ingredient.name }}</td>
        <td>{{ ingredientUnitLabels[ingredient.unit] }}</td>
        <td class="text-right">
          {{ formatPrice(ingredient.price_per_unit) }} /
          {{ ingredientUnitLabels[ingredient.unit] }}
        </td>
        <td>
          <v-chip
            v-if="ingredient.has_extra"
            size="small"
            color="primary"
            variant="tonal"
          >
            +{{ formatPrice(ingredient.extra_price!) }} ·
            {{ ingredient.extra_quantity }}
            {{ ingredientBaseUnitLabels[ingredient.unit] }}
          </v-chip>
        </td>
        <td class="text-right text-no-wrap">
          <v-btn
            icon="mdi-pencil-outline"
            variant="text"
            size="small"
            :disabled="!isOnline"
            @click="openForm(ingredient)"
          ></v-btn>
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="small"
            :disabled="!isOnline"
            @click="openDelete(ingredient)"
          ></v-btn>
        </td>
      </tr>
    </tbody>
  </v-table>

  <v-dialog v-model="isFormOpen" max-width="500">
    <IngredientDialog
      :key="formKey"
      :restaurant-pk="restaurantPk"
      :ingredient="editedIngredient"
      @close="isFormOpen = false"
    ></IngredientDialog>
  </v-dialog>

  <v-dialog v-model="isDeleteOpen" max-width="400">
    <v-card
      prepend-icon="mdi-delete-outline"
      :title="`Delete ${deletedIngredient?.name}?`"
    >
      <v-card-text>
        <v-alert
          v-if="deleteError"
          type="error"
          variant="tonal"
          :text="deleteError"
        >
          <ul v-if="usingRecipes.length" class="mt-2 ml-4">
            <li v-for="recipe in usingRecipes" :key="recipe.pk">
              {{ recipe.name }}
            </li>
          </ul>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="isDeleteOpen = false">Cancel</v-btn>
        <v-btn
          color="error"
          variant="tonal"
          :disabled="!!deleteError"
          :loading="isDeleting"
          @click="onDelete"
          >Delete</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import IngredientDialog from "@/components/IngredientDialog.vue";
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import type { Ingredient } from "@/services/db";
import {
  IngredientInUseError,
  type RecipeRef,
  useIngredientStore,
} from "@/stores/ingredient";
import {
  ingredientBaseUnitLabels,
  ingredientUnitLabels,
} from "@/utils/constant";
import { formatPrice } from "@/utils/format";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const ingredientStore = useIngredientStore();
const { isOnline } = useOnlineStatus();

const restaurantPk = computed(() => String(route.params.restaurantId));

watch(restaurantPk, (pk) => ingredientStore.loadIngredients(pk), {
  immediate: true,
});

const sortedIngredients = computed(() =>
  [...ingredientStore.ingredients].sort((a, b) => a.name.localeCompare(b.name)),
);

const isFormOpen = ref(false);
const formKey = ref(0);
const editedIngredient = ref<Ingredient | null>(null);

function openForm(ingredient: Ingredient | null) {
  editedIngredient.value = ingredient;
  formKey.value++;
  isFormOpen.value = true;
}

const isDeleteOpen = ref(false);
const isDeleting = ref(false);
const deletedIngredient = ref<Ingredient | null>(null);
const deleteError = ref("");
const usingRecipes = ref<RecipeRef[]>([]);

function openDelete(ingredient: Ingredient) {
  deletedIngredient.value = ingredient;
  deleteError.value = "";
  usingRecipes.value = [];
  isDeleteOpen.value = true;
}

async function onDelete() {
  isDeleting.value = true;
  try {
    await ingredientStore.remove(deletedIngredient.value!.pk);
    isDeleteOpen.value = false;
  } catch (error) {
    if (error instanceof IngredientInUseError) {
      usingRecipes.value = error.recipes;
      deleteError.value = error.recipes.length
        ? "Used in these recipes, remove it from them first:"
        : "Used in past orders: it cannot be deleted.";
    } else {
      deleteError.value =
        "Could not delete the ingredient. Check your connection.";
    }
  } finally {
    isDeleting.value = false;
  }
}
</script>
