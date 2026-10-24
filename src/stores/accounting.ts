import api from "@/services/apiClient";
import type { Period } from "@/utils/period";
import { defineStore } from "pinia";
import { ref } from "vue";

// Computed server-side from synced shifts only: not cached in Dexie.
export interface Figures {
  revenue_incl_vat: number;
  revenue_excl_vat: number;
  material_cost: number;
  fixed_charges: number;
  profit: number;
  shift_count: number;
  order_count: number;
}

export interface MonthRow extends Figures {
  start: string;
  end: string;
  status: "past" | "current" | "future";
}

/** shift and date are null on the row of a month without any shift. */
export interface ShiftRow extends Figures {
  shift: string | null;
  date: string | null;
}

export interface OrderRow {
  order: string;
  customer_name: string;
  picking_time: string;
  amount: number;
  cost: number;
}

interface Report<B> {
  start: string;
  end: string;
  totals: Figures;
  breakdown: B[];
}

export interface YearReport extends Report<MonthRow> {
  period: "year";
  /** From 1 January to today included. */
  to_date: Figures;
}

export interface PeriodReport extends Report<ShiftRow> {
  period: "month" | "week";
}

export interface ShiftReport extends Report<OrderRow> {
  period: "shift";
  shift: string;
}

export const useAccountingStore = defineStore("accounting", () => {
  const report = ref<YearReport | PeriodReport | null>(null);

  function url(restaurantPk: string) {
    return `/restaurants/${restaurantPk}/accounting/`;
  }

  // Stepping through periods quickly: only the last request may land.
  let latestLoad = 0;

  async function load(restaurantPk: string, period: Period, date: string) {
    const id = ++latestLoad;
    const { data } = await api.get<YearReport | PeriodReport>(
      url(restaurantPk),
      { params: { period, date } },
    );
    if (id === latestLoad) report.value = data;
  }

  async function loadShift(restaurantPk: string, shiftPk: string) {
    const { data } = await api.get<ShiftReport>(url(restaurantPk), {
      params: { period: "shift", shift: shiftPk },
    });
    return data;
  }

  return { report, load, loadShift };
});
