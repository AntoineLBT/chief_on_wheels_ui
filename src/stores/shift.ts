import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { type Shift, db } from "@/services/db";
import { useRestaurantStore } from "./restaurant";

export const useShiftStore = defineStore("shift", () => {
  const restaurantStore = useRestaurantStore();
  const shifts = ref<Shift[]>([]);

  const activeShift = computed(() =>
    shifts.value.find((s) => s.ended_at === null),
  );

  async function load() {
    await restaurantStore.loadRestaurant();
    shifts.value = await db.shifts
      .where("restaurant")
      .equals(restaurantStore.restaurant!.pk)
      .toArray();
  }

  async function createShift() {
    const shift: Shift = {
      pk: crypto.randomUUID(),
      restaurant: restaurantStore.restaurant!.pk,
      date: new Date().toISOString(),
      ended_at: null,
      is_synced: false,
    };
    await db.shifts.add(shift);
    shifts.value.push(shift);
    return shift;
  }

  async function endShift(shiftId: string) {
    const endat_at = new Date().toISOString();
    await db.shifts.update(shiftId, { ended_at: endat_at });
    const shift = shifts.value.find((s) => s.pk === shiftId);
    if (shift) shift.ended_at = endat_at;
  }

  return { shifts, activeShift, load, createShift, endShift };
});
