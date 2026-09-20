<template>
  <v-card
    prepend-icon="mdi-receipt-text-plus"
    :title="isEditMode ? 'Edit Order' : 'New Order'"
    min-width="600"
  >
    <v-card-subtitle class="mt-1"
      >Select recipes to add to the order</v-card-subtitle
    >

    <v-card-text>
      <v-row>
        <v-col v-for="recipe in recipeStore.recipes" :key="recipe.pk" cols="3">
          <v-btn block variant="tonal" @click="addToCart(recipe)">
            <div>
              <div>{{ recipe.name }}</div>
              <div class="text-caption">{{ recipe.price }}€</div>
            </div>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <template v-if="cartLines.length">
      <v-divider></v-divider>

      <v-card-title>
        <v-icon icon="mdi-cart-outline" class="me-2"></v-icon>Cart
      </v-card-title>

      <v-card-text>
        <v-table density="compact">
          <tbody>
            <tr v-for="line in cartLines" :key="line.id">
              <td>
                <div class="font-weight-medium">{{ line.recipe.name }}</div>
                <div
                  v-for="(action, ingredientPk) in line.modifications"
                  :key="ingredientPk"
                  class="ms-3 text-caption"
                  :class="action === 'ADD' ? 'text-success' : 'text-error'"
                >
                  {{ action === "ADD" ? "+" : "-" }}
                  {{ ingredientStore.getIngredient(String(ingredientPk)).name }}
                </div>
              </td>
              <td class="text-right">{{ line.recipe.price }}€</td>
              <td>
                <div class="d-flex justify-end">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    density="comfortable"
                    size="small"
                    @click="
                      () => {
                        editingLine = line;
                        isEditRecipeOpen = true;
                      }
                    "
                  ></v-btn>
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    density="comfortable"
                    size="small"
                    @click="removeFromCart(line.id)"
                  ></v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-title>
        <v-icon icon="mdi-account-clock" class="me-2"></v-icon>Order info
      </v-card-title>

      <v-card-text>
        <v-row class="align-center">
          <v-col cols="4">
            <v-text-field
              v-model="customerName"
              label="Customer name"
              density="compact"
              :error="submitted && !customerName"
              error-messages=""
            ></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-text-field
              :model-value="pickingTime"
              label="Picking time"
              readonly
              density="compact"
              :error="submitted && !pickingTime"
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
            class="d-flex justify-end align-center text-h5 font-weight-bold"
          >
            {{ total }}€
          </v-col>
        </v-row>
      </v-card-text>
    </template>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="emit('close')">Cancel</v-btn>
      <v-btn
        color="primary"
        variant="tonal"
        :disabled="!isValid"
        @click="onSubmitOrder"
        >Create</v-btn
      >
    </v-card-actions>
  </v-card>

  <v-dialog v-model="isEditRecipeOpen" max-width="400">
    <v-card v-if="editingLine">
      <v-card-title>{{ editingLine.recipe.name }}</v-card-title>
      <v-card-subtitle>Toggle ingredients to add or remove</v-card-subtitle>
      <v-card-text>
        <v-checkbox
          v-for="ingredient in ingredientStore.ingredients"
          :key="ingredient.pk"
          :label="ingredient.name"
          :model-value="isIngredientChecked(ingredient.pk)"
          density="compact"
          hide-details
          @update:model-value="onToggleIngredient(ingredient.pk, $event!)"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="tonal" @click="isEditRecipeOpen = false"
          >Done</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Order, Recipe, Shift } from "@/services/db";
import { useIngredientStore } from "@/stores/ingredient";
import { useOrderStore, type CartLine } from "@/stores/order";
import { useRecipeStore } from "@/stores/recipe";
import { useShiftStore } from "@/stores/shift";
import { computed, onMounted, ref } from "vue";
import { useRecipeIngredientStore } from "../stores/recipeIngredient";

const props = defineProps<{ shiftPk: string; order?: Order }>();
const emit = defineEmits<{ close: [] }>();

const isEditMode = computed(() => !!props.order);

const shift = ref<Shift>();
const recipeStore = useRecipeStore();
const ingredientStore = useIngredientStore();
const shiftStore = useShiftStore();
const recipeIngredientStore = useRecipeIngredientStore();
const orderStore = useOrderStore();

const cartLines = ref<CartLine[]>([]);
const customerName = ref("");
const pickingTime = ref("");
const showMenu = ref(false);
const isEditRecipeOpen = ref(false);
const editingLine = ref<CartLine>();
const submitted = ref(false);

const total = computed(() =>
  cartLines.value.reduce((sum, l) => sum + l.recipe.price, 0),
);

const isValid = computed(
  () =>
    cartLines.value.length > 0 &&
    customerName.value.trim() &&
    pickingTime.value,
);

function addToCart(recipe: Recipe) {
  cartLines.value.push({ id: crypto.randomUUID(), recipe });
}

function removeFromCart(id: string) {
  cartLines.value = cartLines.value.filter((line) => line.id !== id);
}

function isIngredientChecked(ingredientPk: string): boolean {
  const isBase = recipeIngredientStore.isDefaultIngredient(
    ingredientPk,
    editingLine.value!.recipe.pk,
  );
  const modification = editingLine.value?.modifications?.[ingredientPk];
  if (modification === "ADD") return true;
  if (modification === "REMOVE") return false;
  return isBase;
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
  submitted.value = true;
  if (!isValid.value) return;
  const [hours, minutes] = pickingTime.value.split(":").map(Number);
  const pickingDate = new Date();
  pickingDate.setHours(hours!, minutes, 0, 0);
  if (isEditMode.value) {
    await orderStore.updateOrder(
      props.order!.pk,
      customerName.value,
      pickingDate,
      cartLines.value,
    );
  } else {
    await orderStore.createFullOrder(
      shift.value!.pk,
      customerName.value,
      pickingDate,
      cartLines.value,
    );
  }
  emit("close");
}

onMounted(async () => {
  shift.value = await shiftStore.getShift(props.shiftPk);
  await recipeStore.loadRecipes(shift.value!.restaurant);
  await ingredientStore.loadIngredients(shift.value!.restaurant);
  await recipeIngredientStore.loadRecipeIngredients(
    recipeStore.recipes.map((r) => r.pk),
  );
  if (props.order) {
    customerName.value = props.order.customer_name;
    const d = new Date(props.order.picking_time);
    pickingTime.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const lines = await orderStore.loadOrderLines(props.order.pk);
    cartLines.value = lines.map((l) => ({
      id: crypto.randomUUID(),
      recipe: l.recipe,
      modifications: Object.fromEntries(
        l.modifications.map((m) => [m.ingredient.pk, m.action]),
      ),
    }));
  }
});
</script>
