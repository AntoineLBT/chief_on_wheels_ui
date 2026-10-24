import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { type Shift, db } from "@/services/db";

export const useShiftStore = defineStore("shift", () => {
  const shifts = ref<Shift[]>([]);

  const activeShift = computed(() =>
    shifts.value.find((s) => s.ended_at === null),
  );

  async function loadShifts(restaurantPk: string) {
    shifts.value = await db.shifts
      .where("restaurant")
      .equals(restaurantPk)
      .toArray();
  }

  async function createShift(restaurantPk: string) {
    const restaurant = (await db.restaurants.get(restaurantPk))!;
    const shift: Shift = {
      pk: crypto.randomUUID(),
      restaurant: restaurantPk,
      date: new Date().toISOString(),
      ended_at: null,
      vat_rate: restaurant.vat_rate,
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

  async function getShift(pk: string) {
    return await db.shifts.get(pk);
  }

  return { shifts, activeShift, loadShifts, createShift, endShift, getShift };
});
