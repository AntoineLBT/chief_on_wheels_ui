<template>
  <v-row class="justify-end">
    <v-col cols="2"
      ><v-btn prepend-icon="mdi-plus-circle-outline" @click="onCreateOrder"
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
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useOrderStore } from "@/stores/order";
import { OrderStatus } from "@/utils/constant";
import OrderCard from "@/components/OrderCard.vue";

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

async function onCreateOrder() {
  await orderStore.createOrder(props.shiftPk, "JeanJean", new Date());
}

onMounted(async () => {
  await orderStore.loadOrders(props.shiftPk);
});
</script>
