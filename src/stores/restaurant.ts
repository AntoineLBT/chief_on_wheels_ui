import api from "@/services/apiClient";
import { type Restaurant, db, purgeRestaurant } from "@/services/db";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useRestaurantStore = defineStore("restaurant", () => {
  const restaurants = ref<Restaurant[]>([]);

  async function loadRestaurants() {
    restaurants.value = await db.restaurants.toArray();
  }

  async function create(name: string) {
    const { data } = await api.post<Restaurant>("/restaurants/", { name });
    await db.restaurants.put(data);
    restaurants.value.push(data);
    return data;
  }

  async function update(
    pk: string,
    changes: Partial<Pick<Restaurant, "name" | "vat_rate">>,
  ) {
    const { data } = await api.patch<Restaurant>(
      `/restaurants/${pk}/`,
      changes,
    );
    await db.restaurants.put(data);
    restaurants.value = restaurants.value.map((r) => (r.pk === pk ? data : r));
    return data;
  }

  async function remove(pk: string) {
    await api.delete(`/restaurants/${pk}/`);
    await purgeRestaurant(pk);
    restaurants.value = restaurants.value.filter((r) => r.pk !== pk);
  }

  return { restaurants, loadRestaurants, create, update, remove };
});
