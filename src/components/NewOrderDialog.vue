<template>
  <v-card prepend-icon="mdi-account" title="New Order">
    <v-card-text>
      <v-row>
        <v-col v-for="recipe in recipeStore.recipes" :key="recipe.pk" cols="3">
          <v-btn block @click="addToCart(recipe)"
            >{{ recipe.name }} - {{ recipe.price }}€</v-btn
          >
        </v-col>
      </v-row>
    </v-card-text>

    <div v-if="cartLines.length" class="mb-1">
      <v-divider></v-divider>

      <v-card-title
        ><v-icon icon="mdi-cart-outline" class="me-2"></v-icon
        >Cart</v-card-title
      >

      <v-card-text>
        <v-row class="d-flex justify-center mb-6">
          <v-col cols="10">
            <v-table>
              <tbody>
                <tr v-for="line in cartLines" :key="line.id">
                  <td>
                    <h3>
                      {{ line.recipe.name }}
                    </h3>
                    <div
                      v-for="(action, ingredientPk) in line.modifications"
                      :key="ingredientPk"
                      class="ms-4"
                    >
                      <i
                        >{{ action }} -
                        {{
                          ingredientStore.getIngredient(ingredientPk).name
                        }}</i
                      >
                    </div>
                  </td>
                  <td>
                    <v-row class="justify-end">
                      <v-btn
                        icon="mdi-pencil"
                        variant="flat"
                        density="comfortable"
                        @click="
                          () => {
                            ((isEditRecipeOpen = !isEditRecipeOpen),
                              (editingLine = line));
                          }
                        "
                      ></v-btn>
                      <v-btn
                        icon="mdi-close"
                        variant="flat"
                        density="comfortable"
                        @click="removeFromCart(line.id)"
                      ></v-btn>
                    </v-row>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider class="mb-4"></v-divider>

      <v-card-title
        ><v-icon icon="mdi-account-clock" class="me-2 mb-2"></v-icon
        >Info</v-card-title
      >

      <v-row class="ms-2 me-2">
        <v-col cols="4">
          <v-text-field v-model="customerName" label="Name"></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            :model-value="pickingTime"
            label="Picking time"
            readonly
          >
            <v-menu
              v-model="showMenu"
              :close-on-content-click="false"
              activator="parent"
              min-width="0"
            >
              <v-time-picker v-model="pickingTime"></v-time-picker>
            </v-menu>
          </v-text-field>
        </v-col>
        <v-col
          cols="4"
          class="d-flex justify-end align-center mb-6 text-h4 font-weight-bold"
          >{{ total }}€</v-col
        >
      </v-row>
    </div>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        text="Create"
        variant="tonal"
        @click="onSubmitOrder"
      ></v-btn>
    </v-card-actions>
  </v-card>

  <v-dialog v-model="isEditRecipeOpen">
    <v-card v-if="editingLine">
      <v-card-title>{{ editingLine.recipe.name }}</v-card-title>
      <v-card-text>
        <v-checkbox
          v-for="ingredient in ingredientStore.ingredients"
          :key="ingredient.pk"
          :label="ingredient.name"
          :model-value="isIngredientChecked(ingredient.pk)"
          @update:model-value="onToggleIngredient(ingredient.pk, $event!)"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn @click="isEditRecipeOpen = false">Done</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import type { Recipe, Shift } from "@/services/db";
import { useIngredientStore } from "@/stores/ingredient";
import { useOrderStore, type CartLine } from "@/stores/order";
import { useRecipeStore } from "@/stores/recipe";
import { useShiftStore } from "@/stores/shift";
import { onMounted, ref } from "vue";
import { useRecipeIngredientStore } from "../stores/recipeIngredient";
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps<{ shiftPk: string }>();
const emit = defineEmits<{ close: [] }>();

const shift = ref<Shift>();

const recipeStore = useRecipeStore();
const ingredientStore = useIngredientStore();
const shiftStore = useShiftStore();
const recipeIngredientStore = useRecipeIngredientStore();
const orderStore = useOrderStore();

const cartLines = ref<CartLine[]>([]);
const customerName = ref<string>("");
const pickingTime = ref<string>("");
const showMenu = ref(false);
const total = ref<number>();
const isEditRecipeOpen = ref<boolean>(false);
const editingLine = ref<CartLine>();

function addToCart(recipe: Recipe) {
  cartLines.value.push({ id: crypto.randomUUID(), recipe: recipe });
  refreshTotal();
}

function removeFromCart(id: string) {
  cartLines.value = cartLines.value.filter((line) => line.id != id);
  refreshTotal();
}

function refreshTotal() {
  total.value = cartLines.value.reduce(
    (total, cartLine) => total + cartLine.recipe.price,
    0,
  );
}

function isIngredientChecked(ingredientPk: string): boolean {
  const isBaseIngredient: boolean = recipeIngredientStore.isDefaultIngredient(
    ingredientPk,
    editingLine.value!.recipe.pk,
  );
  const modification = editingLine.value?.modifications?.[ingredientPk];

  if (modification === "ADD") return true;
  if (modification === "REMOVE") return false;
  return isBaseIngredient;
}

function onToggleIngredient(ingredientPk: string, checked: boolean) {
  const line = editingLine.value!;
  const isBase = recipeIngredientStore.isDefaultIngredient(
    ingredientPk,
    editingLine.value!.recipe.pk,
  );

  if (checked === isBase) {
    const { [ingredientPk]: _, ...rest } = line.modifications ?? {};
    line.modifications = rest;
  } else {
    line.modifications = {
      ...line.modifications,
      [ingredientPk]: checked ? "ADD" : "REMOVE",
    };
  }
}

async function onSubmitOrder() {
  const [hours, minutes] = pickingTime.value.split(":").map(Number);
  const pickingDate = new Date();
  pickingDate.setHours(hours!, minutes, 0, 0);
  await orderStore.createFullOrder(
    shift.value!.pk,
    customerName.value,
    pickingDate,
    cartLines.value,
  );
  emit("close");
}

onMounted(async () => {
  shift.value = await shiftStore.getShift(props.shiftPk);
  await recipeStore.loadRecipes(shift.value!.restaurant);
  await ingredientStore.loadIngredients(shift.value!.restaurant);
  await recipeIngredientStore.loadRecipeIngredients(
    recipeStore.recipes.map((r) => r.pk),
  );
});
</script>
