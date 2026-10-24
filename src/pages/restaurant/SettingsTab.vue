<template>
  <v-alert
    v-if="!isOnline"
    type="info"
    variant="tonal"
    density="compact"
    class="mb-4"
    :text="t('settings.offline')"
  ></v-alert>

  <div class="text-h6 mb-4">{{ t("settings.restaurant") }}</div>
  <v-form
    v-model="isRestaurantValid"
    :disabled="!isOnline"
    @submit.prevent="onSaveRestaurant"
  >
    <v-row>
      <v-col cols="12" sm="8">
        <v-text-field
          v-model="restaurantForm.name"
          :label="t('common.name')"
          :rules="[rules.required]"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          v-model.number="restaurantForm.vat_rate"
          :label="t('settings.vatRate')"
          type="number"
          min="0"
          max="100"
          step="0.01"
          suffix="%"
          :rules="[rules.required, rules.percentage]"
        ></v-text-field>
      </v-col>
    </v-row>
    <div class="d-flex align-center">
      <v-alert
        v-if="restaurantError"
        type="error"
        variant="tonal"
        density="compact"
        :text="restaurantError"
      ></v-alert>
      <v-spacer></v-spacer>
      <v-btn
        type="submit"
        color="primary"
        variant="tonal"
        :disabled="!isRestaurantValid || !isRestaurantChanged"
        :loading="isSavingRestaurant"
        >{{ t("common.save") }}</v-btn
      >
    </div>
  </v-form>

  <v-divider class="my-6"></v-divider>

  <div class="d-flex align-center mb-4">
    <div class="text-h6">{{ t("fixedCharges.title") }}</div>
    <v-spacer></v-spacer>
    <v-btn
      color="primary"
      variant="tonal"
      prepend-icon="mdi-plus"
      :disabled="!isOnline"
      @click="openForm(null)"
      >{{ t("fixedCharges.new") }}</v-btn
    >
  </div>

  <v-empty-state
    v-if="!isOnline"
    icon="mdi-wifi-off"
    :title="t('fixedCharges.onlineOnly')"
  ></v-empty-state>

  <v-alert
    v-else-if="chargesError"
    type="error"
    variant="tonal"
    :text="chargesError"
  ></v-alert>

  <v-empty-state
    v-else-if="!sortedCharges.length"
    icon="mdi-cash-clock"
    :title="t('fixedCharges.empty')"
  ></v-empty-state>

  <v-table v-else>
    <thead>
      <tr>
        <th>{{ t("common.name") }}</th>
        <th class="text-right">{{ t("common.amount") }}</th>
        <th>{{ t("common.frequency") }}</th>
        <th>{{ t("fixedCharges.since") }}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="charge in sortedCharges" :key="charge.pk">
        <td>{{ charge.name }}</td>
        <td class="text-right">{{ formatPrice(charge.amount) }}</td>
        <td>{{ t(`frequencies.${charge.frequency}`) }}</td>
        <td>{{ formatDate(charge.start_date) }}</td>
        <td class="text-right text-no-wrap">
          <v-btn
            icon="mdi-pencil-outline"
            variant="text"
            size="small"
            @click="openForm(charge)"
          ></v-btn>
          <v-btn
            icon="mdi-close-circle-outline"
            variant="text"
            size="small"
            @click="openClose(charge)"
          ></v-btn>
        </td>
      </tr>
    </tbody>
  </v-table>

  <v-divider class="my-6"></v-divider>

  <v-card variant="outlined" color="error">
    <v-card-item
      prepend-icon="mdi-alert-outline"
      :title="t('settings.dangerZone')"
      :subtitle="t('settings.dangerHint')"
    >
      <template #append>
        <v-btn
          color="error"
          variant="tonal"
          prepend-icon="mdi-delete-outline"
          :disabled="!isOnline || !restaurant"
          @click="openDeleteRestaurant"
          >{{ t("settings.deleteRestaurant") }}</v-btn
        >
      </template>
    </v-card-item>
  </v-card>

  <v-dialog v-model="isDeleteRestaurantOpen" max-width="450">
    <DeleteRestaurantDialog
      v-if="restaurant"
      :key="deleteRestaurantKey"
      :restaurant="restaurant"
      @close="isDeleteRestaurantOpen = false"
    ></DeleteRestaurantDialog>
  </v-dialog>

  <v-dialog v-model="isFormOpen" max-width="500">
    <FixedChargeDialog
      :key="formKey"
      :restaurant-pk="restaurantPk"
      :charge="editedCharge"
      @close="isFormOpen = false"
    ></FixedChargeDialog>
  </v-dialog>

  <v-dialog v-model="isCloseOpen" max-width="400">
    <v-card
      prepend-icon="mdi-close-circle-outline"
      :title="t('fixedCharges.stopTitle', { name: closedCharge?.name })"
    >
      <v-form v-model="isCloseValid" @submit.prevent="onClose">
        <v-card-text>
          <p class="mb-4">
            {{ t("fixedCharges.stopHint") }}
          </p>
          <v-text-field
            v-model="closeDate"
            :label="t('fixedCharges.lastDay')"
            type="date"
            :min="closedCharge?.start_date"
            :rules="[rules.required, rules.notBeforeStart]"
          ></v-text-field>
          <v-alert
            v-if="closeError"
            type="error"
            variant="tonal"
            :text="closeError"
          ></v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isCloseOpen = false">{{
            t("common.cancel")
          }}</v-btn>
          <v-btn
            type="submit"
            color="error"
            variant="tonal"
            :disabled="!isCloseValid"
            :loading="isClosing"
            >{{ t("fixedCharges.stop") }}</v-btn
          >
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import DeleteRestaurantDialog from "@/components/DeleteRestaurantDialog.vue";
import FixedChargeDialog from "@/components/FixedChargeDialog.vue";
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import { type FixedCharge, useFixedChargeStore } from "@/stores/fixedCharge";
import { useRestaurantStore } from "@/stores/restaurant";
import { localIsoDate } from "@/utils/date";
import { formatDate, formatPrice } from "@/utils/format";
import { isAxiosError } from "axios";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const route = useRoute();
const restaurantStore = useRestaurantStore();
const fixedChargeStore = useFixedChargeStore();
const { t } = useI18n();
const { isOnline } = useOnlineStatus();

const restaurantPk = computed(() => String(route.params.restaurantId));
const restaurant = computed(() =>
  restaurantStore.restaurants.find((r) => r.pk === restaurantPk.value),
);

// v-model.number yields "" for an empty number field.
type NumberField = number | "";

const rules = {
  required: (value: NumberField | string) =>
    (value !== "" && String(value).trim() !== "") || t("validation.required"),
  percentage: (value: NumberField) =>
    (Number(value) >= 0 && Number(value) <= 100) || t("validation.percentage"),
  // ISO dates compare as strings.
  notBeforeStart: (value: string) =>
    value >= closedCharge.value!.start_date ||
    t("fixedCharges.notBeforeStart", {
      date: formatDate(closedCharge.value!.start_date),
    }),
};

// Restaurant

const restaurantForm = reactive({ name: "", vat_rate: 0 as NumberField });
const isRestaurantValid = ref(false);
const isSavingRestaurant = ref(false);
const restaurantError = ref("");

// The restaurant list loads with the layout: fill the form once it is there.
watch(
  restaurant,
  (current) => {
    restaurantForm.name = current?.name ?? "";
    restaurantForm.vat_rate = current?.vat_rate ?? 0;
    restaurantError.value = "";
  },
  { immediate: true },
);

const isRestaurantChanged = computed(
  () =>
    restaurantForm.name.trim() !== restaurant.value?.name ||
    Number(restaurantForm.vat_rate) !== restaurant.value?.vat_rate,
);

async function onSaveRestaurant() {
  if (!isRestaurantValid.value) return;
  isSavingRestaurant.value = true;
  restaurantError.value = "";
  try {
    await restaurantStore.update(restaurantPk.value, {
      name: restaurantForm.name.trim(),
      vat_rate: Number(restaurantForm.vat_rate),
    });
  } catch {
    restaurantError.value = t("settings.saveError");
  } finally {
    isSavingRestaurant.value = false;
  }
}

const isDeleteRestaurantOpen = ref(false);
const deleteRestaurantKey = ref(0);

function openDeleteRestaurant() {
  deleteRestaurantKey.value++;
  isDeleteRestaurantOpen.value = true;
}

// Fixed charges (online only, not cached)

const chargesError = ref("");

watch(
  [restaurantPk, isOnline],
  async ([pk, online]) => {
    fixedChargeStore.charges = [];
    chargesError.value = "";
    if (!online) return;
    try {
      await fixedChargeStore.load(pk);
    } catch {
      chargesError.value = t("fixedCharges.loadError");
    }
  },
  { immediate: true },
);

const sortedCharges = computed(() =>
  [...fixedChargeStore.charges].sort((a, b) => a.name.localeCompare(b.name)),
);

const isFormOpen = ref(false);
const formKey = ref(0);
const editedCharge = ref<FixedCharge | null>(null);

function openForm(charge: FixedCharge | null) {
  editedCharge.value = charge;
  formKey.value++;
  isFormOpen.value = true;
}

const isCloseOpen = ref(false);
const isCloseValid = ref(false);
const isClosing = ref(false);
const closedCharge = ref<FixedCharge | null>(null);
const closeDate = ref("");
const closeError = ref("");

function openClose(charge: FixedCharge) {
  closedCharge.value = charge;
  closeDate.value = localIsoDate();
  closeError.value = "";
  isCloseOpen.value = true;
}

async function onClose() {
  if (!isCloseValid.value) return;
  isClosing.value = true;
  closeError.value = "";
  try {
    await fixedChargeStore.close(closedCharge.value!.pk, closeDate.value);
    isCloseOpen.value = false;
  } catch (e) {
    // The API answers in English: show our own message for each case.
    const data = isAxiosError(e) ? e.response?.data : undefined;
    if (data?.effective_date) {
      closeError.value = t("fixedCharges.notBeforeStart", {
        date: formatDate(closedCharge.value!.start_date),
      });
    } else if (data?.detail) {
      closeError.value = t("fixedCharges.alreadyClosed");
    } else {
      closeError.value = t("fixedCharges.stopError");
    }
  } finally {
    isClosing.value = false;
  }
}
</script>
