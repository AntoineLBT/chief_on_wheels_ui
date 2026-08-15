<template>
  <v-row class="justify-end">
    <v-col cols="2"
      ><v-btn
        prepend-icon="mdi-plus-circle-outline"
        @click="() => (isCreateDialogOpen = !isCreateDialogOpen)"
        >Create Order</v-btn
      ></v-col
    >
  </v-row>
  <v-row>
    <v-col cols="4"
      ><OrderCard v-for="order in todo" :key="order.pk" :order="order"
    /></v-col>
    <v-col cols="4">
      <OrderCard v-for="order in inProgress" :key="order.pk" :order="order" />
    </v-col>
    <v-col cols="4"
      ><OrderCard v-for="order in done" :key="order.pk" :order="order"
    /></v-col>
  </v-row>
  <v-dialog v-model="isCreateDialogOpen" max-width="75%">
    <NewOrderDialog
      :shift-pk="props.shiftPk"
      @close="isCreateDialogOpen = false"
    ></NewOrderDialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useOrderStore } from "@/stores/order";
import { OrderStatus } from "@/utils/constant";
import OrderCard from "@/components/OrderCard.vue";
import NewOrderDialog from "@/components/NewOrderDialog.vue";

const orderStore = useOrderStore();

const props = defineProps<{ shiftPk: string }>();

const todo = computed(() =>
  orderStore.orders.filter((o) => o.status === OrderStatus.todo),
);
const inProgress = computed(() =>
  orderStore.orders.filter((o) => o.status === OrderStatus.inProgress),
);
const done = computed(() =>
  orderStore.orders.filter((o) => o.status === OrderStatus.done),
);

const isCreateDialogOpen = ref<boolean>(false);

onMounted(async () => {
  await orderStore.loadOrders(props.shiftPk);
});
</script>
