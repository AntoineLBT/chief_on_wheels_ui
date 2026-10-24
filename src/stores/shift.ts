import { defineStore } from "pinia";
import { type Shift, db } from "@/services/db";
import { OrderStatus } from "@/utils/constant";

export class ShiftAlreadyOpenError extends Error {
  constructor(readonly shift: Shift) {
    super("This restaurant already has an open shift");
    this.name = "ShiftAlreadyOpenError";
  }
}

// One open shift per restaurant: the rule lives here only, the server never
// receives an open shift.
async function findOpenShift(restaurantPk: string) {
  const open = await db.shifts
    .where("restaurant")
    .equals(restaurantPk)
    .filter((shift) => shift.ended_at === null)
    .first();
  return open ?? null;
}

/** Router guard: only the open shift of the restaurant can be opened. */
export async function resolveShiftRoute(restaurantPk: string, shiftPk: string) {
  const open = await findOpenShift(restaurantPk);
  if (open?.pk !== shiftPk) return `/restaurants/${restaurantPk}`;
}

export const useShiftStore = defineStore("shift", () => {
  async function currentOpenShift(restaurantPk: string) {
    return findOpenShift(restaurantPk);
  }

  async function startShift(restaurantPk: string) {
    const open = await findOpenShift(restaurantPk);
    if (open) throw new ShiftAlreadyOpenError(open);
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
    return shift;
  }

  /** markAllDone: unfinished orders would otherwise not count in accounting. */
  async function endShift(shiftPk: string, { markAllDone = false } = {}) {
    const ended_at = new Date().toISOString();
    await db.transaction("rw", db.shifts, db.orders, async () => {
      if (markAllDone) {
        await db.orders
          .where("shift")
          .equals(shiftPk)
          .modify({ status: OrderStatus.done });
      }
      await db.shifts.update(shiftPk, { ended_at });
    });
  }

  async function getShift(pk: string) {
    return await db.shifts.get(pk);
  }

  return {
    currentOpenShift,
    startShift,
    endShift,
    getShift,
  };
});
