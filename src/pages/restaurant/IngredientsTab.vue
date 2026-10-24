<template>
  <div class="d-flex align-center mb-4">
    <div class="text-h6">{{ t("ingredients.title") }}</div>
    <v-spacer></v-spacer>
    <v-btn
      color="primary"
      variant="tonal"
      prepend-icon="mdi-plus"
      :disabled="!isOnline"
      @click="openForm(null)"
      >{{ t("ingredients.new") }}</v-btn
    >
  </div>

  <v-alert
    v-if="!isOnline"
    type="info"
    variant="tonal"
    density="compact"
    class="mb-4"
    :text="t('ingredients.offline')"
  ></v-alert>

  <v-empty-state
    v-if="!sortedIngredients.length"
    icon="mdi-food-apple-outline"
    :title="t('ingredients.empty')"
  ></v-empty-state>

  <v-table v-else>
    <thead>
      <tr>
        <th>{{ t("common.name") }}</th>
        <th>{{ t("ingredients.soldBy") }}</th>
        <th class="text-right">{{ t("common.price") }}</th>
        <th>{{ t("ingredients.extra") }}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="ingredient in sortedIngredients" :key="ingredient.pk">
        <td>{{ ingredient.name }}</td>
        <td>{{ t(`units.${ingredient.unit}`) }}</td>
        <td class="text-right">
          {{
            t("ingredients.pricePer", {
              price: formatPrice(ingredient.price_per_unit),
              unit: t(`units.${ingredient.unit}`),
            })
          }}
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
            {{ t(`baseUnits.${ingredient.unit}`) }}
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
      :title="t('ingredients.deleteTitle', { name: deletedIngredient?.name })"
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
        <v-btn variant="text" @click="isDeleteOpen = false">{{
          t("common.cancel")
        }}</v-btn>
        <v-btn
          color="error"
          variant="tonal"
          :disabled="!!deleteError"
          :loading="isDeleting"
          @click="onDelete"
          >{{ t("common.delete") }}</v-btn
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
import { formatPrice } from "@/utils/format";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const route = useRoute();
const ingredientStore = useIngredientStore();
const { t } = useI18n();
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
        ? t("ingredients.usedInRecipes")
        : t("ingredients.usedInOrders");
    } else {
      deleteError.value = t("ingredients.deleteError");
    }
  } finally {
    isDeleting.value = false;
  }
}
</script>
