import api from "@/services/apiClient";
import { defineStore } from "pinia";
import { ref } from "vue";

export interface Restaurant {
  pk: string;
  name: string;
  type: string;
}

export const useRestaurantStore = defineStore("restaurant", () => {
  const restaurant = ref<Restaurant | null>(
    JSON.parse(localStorage.getItem("restaurant") ?? "null"),
  );

  async function loadRestaurant() {
    const response = await api.get("/restaurants/");
    restaurant.value = response.data[0];
    localStorage.setItem("restaurant", JSON.stringify(response.data[0]));
  }

  return { restaurant, loadRestaurant };
});
