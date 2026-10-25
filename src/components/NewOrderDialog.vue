<template>
  <v-card
    prepend-icon="mdi-receipt-text-plus"
    :title="isEditMode ? t('orders.edit') : t('orders.new')"
    min-width="600"
  >
    <v-card-subtitle class="mt-1">{{
      t("orders.selectRecipes")
    }}</v-card-subtitle>

    <v-card-text>
      <v-row>
        <v-col v-for="recipe in activeRecipes" :key="recipe.pk" cols="3">
          <v-btn block variant="tonal" size="large" @click="addToCart(recipe)">
            <div>
              <div>{{ recipe.name }}</div>
              <div class="text-caption">{{ formatPrice(recipe.price) }}</div>
            </div>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <template v-if="cartLines.length">
      <v-divider></v-divider>

      <v-card-title>
        <v-icon icon="mdi-cart-outline" class="me-2"></v-icon
        >{{ t("orders.cart") }}
      </v-card-title>

      <v-card-text>
        <v-table density="compact">
          <tbody>
            <tr v-for="line in cartLines" :key="line.id">
              <td>
                <div class="text-h6">{{ line.recipe.name }}</div>
                <div
                  v-for="modification in snapshotOf(line).modifications"
                  :key="modification.ingredient"
                  class="ms-3 text-caption"
                  :class="
                    modification.action_type === 'ADD'
                      ? 'text-success'
                      : 'text-error'
                  "
                >
                  {{ modification.action_type === "ADD" ? "+" : "-" }}
                  {{
                    ingredientStore.getIngredient(modification.ingredient).name
                  }}
                  <span v-if="modification.extra_price">
                    ({{ formatPrice(modification.extra_price) }})</span
                  >
                </div>
              </td>
              <td class="text-right">
                {{ formatPrice(orderTotal([snapshotOf(line)])) }}
              </td>
              <td>
                <div class="d-flex justify-end">
                  <v-btn
                    icon="mdi-pencil"
                    variant="tonal"
                    density="comfortable"
                    size="large"
                    class="me-2 mb-1 mt-1"
                    @click="
                      () => {
                        editingLine = line;
                        isEditRecipeOpen = true;
                      }
                    "
                  ></v-btn>
                  <v-btn
                    icon="mdi-close"
                    variant="tonal"
                    density="comfortable"
                    class="mb-2 mt-1"
                    size="large"
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
        <v-icon icon="mdi-account-clock" class="me-2"></v-icon
        >{{ t("orders.info") }}
      </v-card-title>

      <v-card-text>
        <v-row class="align-center">
          <v-col cols="4">
            <v-text-field
              v-model="customerName"
              :label="t('orders.customerName')"
              :error="submitted && !customerName"
              error-messages=""
            ></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-text-field
              :model-value="pickingTime"
              :label="t('orders.pickingTime')"
              readonly
              :error="submitted && !pickingTime"
            >
              <v-menu
                v-model="showMenu"
                :close-on-content-click="false"
                activator="parent"
                min-width="0"
              >
                <v-card>
                  <v-card-text class="d-flex align-center justify-center">
                    <TimeWheel v-model="pickingHours" :values="HOURS" />
                    <span class="text-h5 mx-2">:</span>
                    <TimeWheel v-model="pickingMinutes" :values="MINUTES" />
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      variant="tonal"
                      @click="showMenu = false"
                      >{{ t("common.done") }}</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-menu>
            </v-text-field>
          </v-col>
          <v-col
            cols="4"
            class="d-flex justify-end align-center text-h5 font-weight-bold"
          >
            {{ formatPrice(total) }}
          </v-col>
        </v-row>
      </v-card-text>
    </template>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="emit('close')">{{
        t("common.cancel")
      }}</v-btn>
      <v-btn
        color="primary"
        variant="tonal"
        :disabled="!isValid"
        @click="onSubmitOrder"
        >{{ isEditMode ? t("common.save") : t("common.create") }}</v-btn
      >
    </v-card-actions>
  </v-card>

  <v-dialog v-model="isEditRecipeOpen" max-width="400">
    <v-card v-if="editingLine">
      <v-card-title>{{ editingLine.recipe.name }}</v-card-title>
      <v-card-subtitle>{{ t("orders.toggleIngredients") }}</v-card-subtitle>
      <v-card-text>
        <v-checkbox
          v-for="ingredient in ingredientStore.ingredients"
          :key="ingredient.pk"
          :model-value="isIngredientChecked(ingredient.pk)"
          density="compact"
          hide-details
          @update:model-value="onToggleIngredient(ingredient.pk, $event!)"
        >
          <template #label>
            {{ ingredient.name }}
            <!-- Only adding an extra is charged, not keeping a base ingredient. -->
            <v-chip
              v-if="
                ingredient.has_extra &&
                !recipeIngredientStore.isDefaultIngredient(
                  ingredient.pk,
                  editingLine.recipe.pk,
                )
              "
              size="x-small"
              color="primary"
              variant="tonal"
              class="ms-2"
              >+{{ formatPrice(ingredient.extra_price!) }}</v-chip
            >
          </template>
        </v-checkbox>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="tonal"
          @click="isEditRecipeOpen = false"
          >{{ t("common.done") }}</v-btn
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
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { formatPrice } from "@/utils/format";
import { orderTotal, snapshotLine } from "@/utils/order";
import { useRecipeIngredientStore } from "../stores/recipeIngredient";
import { ceilToMinuteStep } from "@/utils/date";
import TimeWheel from "./TimeWheel.vue";

const MINUTE_STEP = 5;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from(
  { length: 60 / MINUTE_STEP },
  (_, i) => i * MINUTE_STEP,
);

const props = defineProps<{ shiftPk: string; order?: Order }>();
const emit = defineEmits<{ close: [] }>();

const isEditMode = computed(() => !!props.order);

const shift = ref<Shift>();
const recipeStore = useRecipeStore();
// Inactive recipes stay cached (past orders reference them) but cannot be ordered.
const activeRecipes = computed(() =>
  recipeStore.recipes.filter((recipe) => recipe.is_active),
);
const ingredientStore = useIngredientStore();
const shiftStore = useShiftStore();
const recipeIngredientStore = useRecipeIngredientStore();
const orderStore = useOrderStore();
const { t } = useI18n();

const cartLines = ref<CartLine[]>([]);
const customerName = ref("");
const pickingTime = ref("");
const showMenu = ref(false);

function toPickingTime(hours: number, minutes: number) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
const pickingHours = computed({
  get: () => Number(pickingTime.value.split(":")[0]),
  set: (hours) =>
    (pickingTime.value = toPickingTime(hours, pickingMinutes.value)),
});
const pickingMinutes = computed({
  get: () => Number(pickingTime.value.split(":")[1]),
  set: (minutes) =>
    (pickingTime.value = toPickingTime(pickingHours.value, minutes)),
});

// Opening the wheels on an empty field proposes the next 5-minute slot.
watch(showMenu, (isOpen) => {
  if (isOpen && !pickingTime.value) {
    const { hours, minutes } = ceilToMinuteStep(new Date(), MINUTE_STEP);
    pickingTime.value = toPickingTime(hours, minutes);
  }
});
const isEditRecipeOpen = ref(false);
const editingLine = ref<CartLine>();
const submitted = ref(false);

// The same snapshot the store will freeze: the customer sees what is charged.
const ingredientsByPk = computed(
  () => new Map(ingredientStore.ingredients.map((i) => [i.pk, i])),
);
function snapshotOf(line: CartLine) {
  return snapshotLine(
    line,
    recipeIngredientStore.recipeIngredients,
    ingredientsByPk.value,
  );
}
const total = computed(() => orderTotal(cartLines.value.map(snapshotOf)));

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
    pickingTime.value = toPickingTime(d.getHours(), d.getMinutes());
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
