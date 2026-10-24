<template>
  <div class="d-flex align-center mb-4">
    <div class="text-h6">Recipes</div>
    <v-spacer></v-spacer>
    <v-btn
      color="primary"
      variant="tonal"
      prepend-icon="mdi-plus"
      :disabled="!isOnline"
      @click="openForm(null)"
      >New recipe</v-btn
    >
  </div>

  <v-alert
    v-if="!isOnline"
    type="info"
    variant="tonal"
    density="compact"
    class="mb-4"
    text="Offline: recipes are read-only."
  ></v-alert>

  <v-empty-state
    v-if="!rows.length"
    icon="mdi-pizza"
    title="No recipe yet"
  ></v-empty-state>

  <v-table v-else>
    <thead>
      <tr>
        <th>Name</th>
        <th class="text-right">Price</th>
        <th class="text-right">Cost</th>
        <th class="text-right">Margin</th>
        <th class="text-right">Coefficient</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in rows"
        :key="row.recipe.pk"
        :class="{ 'text-disabled': !row.recipe.is_active }"
      >
        <td>{{ row.recipe.name }}</td>
        <td class="text-right">{{ formatPrice(row.recipe.price) }}</td>
        <td class="text-right">{{ formatPrice(row.cost) }}</td>
        <td class="text-right">{{ formatPrice(row.margin) }}</td>
        <td class="text-right">{{ formatCoefficient(row.coefficient) }}</td>
        <td class="text-right">
          <v-chip
            size="small"
            variant="tonal"
            :color="row.recipe.is_active ? 'success' : undefined"
            >{{ row.recipe.is_active ? "Active" : "Inactive" }}</v-chip
          >
          <v-btn
            icon="mdi-pencil-outline"
            variant="text"
            size="small"
            class="ml-2"
            :disabled="!isOnline"
            @click="openForm(row.recipe)"
          ></v-btn>
        </td>
      </tr>
    </tbody>
  </v-table>

  <v-dialog v-model="isFormOpen" fullscreen>
    <RecipeDialog
      :key="formKey"
      :restaurant-pk="restaurantPk"
      :recipe="editedRecipe"
      @close="closeForm"
    ></RecipeDialog>
  </v-dialog>
</template>

<script setup lang="ts">
import RecipeDialog from "@/components/RecipeDialog.vue";
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import { useIngredientStore } from "@/stores/ingredient";
import { useRecipeStore } from "@/stores/recipe";
import { useRecipeIngredientStore } from "@/stores/recipeIngredient";
import { recipeCoefficient, recipeCost, recipeMargin } from "@/utils/cost";
import { formatCoefficient, formatPrice } from "@/utils/format";
import type { Recipe } from "@/services/db";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const recipeStore = useRecipeStore();
const ingredientStore = useIngredientStore();
const recipeIngredientStore = useRecipeIngredientStore();
const { isOnline } = useOnlineStatus();

const restaurantPk = computed(() => String(route.params.restaurantId));

async function load(pk: string) {
  await Promise.all([
    recipeStore.loadRecipes(pk),
    ingredientStore.loadIngredients(pk),
  ]);
  await recipeIngredientStore.loadRecipeIngredients(
    recipeStore.recipes.map((r) => r.pk),
  );
}

watch(restaurantPk, load, { immediate: true });

const ingredientsByPk = computed(
  () => new Map(ingredientStore.ingredients.map((i) => [i.pk, i])),
);

const rows = computed(() =>
  [...recipeStore.recipes]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((recipe) => {
      const lines = recipeIngredientStore.recipeIngredients.filter(
        (line) => line.recipe === recipe.pk,
      );
      const cost = recipeCost(lines, ingredientsByPk.value);
      return {
        recipe,
        cost,
        margin: recipeMargin(recipe.price, cost),
        coefficient: recipeCoefficient(recipe.price, cost),
      };
    }),
);

const isFormOpen = ref(false);
const formKey = ref(0);
const editedRecipe = ref<Recipe | null>(null);

function openForm(recipe: Recipe | null) {
  editedRecipe.value = recipe;
  formKey.value++;
  isFormOpen.value = true;
}

// The store wrote the new lines to Dexie: reload them for the cost column.
async function closeForm() {
  isFormOpen.value = false;
  await load(restaurantPk.value);
}
</script>
