import api from "@/services/apiClient";
import type { FixedChargeFrequency } from "@/utils/constant";
import { defineStore } from "pinia";
import { ref } from "vue";

// Not cached in Dexie: only the server-side accounting uses fixed charges.
export interface FixedCharge {
  pk: string;
  restaurant: string;
  name: string;
  amount: number;
  frequency: FixedChargeFrequency;
  /** ISO dates (YYYY-MM-DD); end_date is inclusive, null while active. */
  start_date: string;
  end_date: string | null;
}

export type FixedChargeInput = Pick<
  FixedCharge,
  "name" | "amount" | "frequency"
> &
  Partial<Pick<FixedCharge, "start_date">>;

/** Changes taking effect on effective_date (server default: today). */
export type FixedChargeRevision = Partial<
  Pick<FixedCharge, "amount" | "frequency">
> & { effective_date?: string };

export const useFixedChargeStore = defineStore("fixedCharge", () => {
  const charges = ref<FixedCharge[]>([]);

  async function load(restaurantPk: string) {
    const { data } = await api.get<FixedCharge[]>(
      `/restaurants/${restaurantPk}/fixed-charges/`,
    );
    charges.value = data;
  }

  async function create(restaurantPk: string, input: FixedChargeInput) {
    const { data } = await api.post<FixedCharge>(
      `/restaurants/${restaurantPk}/fixed-charges/`,
      input,
    );
    charges.value.push(data);
    return data;
  }

  function url(chargePk: string, action = "") {
    const { restaurant } = charges.value.find((c) => c.pk === chargePk)!;
    return `/restaurants/${restaurant}/fixed-charges/${chargePk}/${action}`;
  }

  function replace(chargePk: string, charge: FixedCharge) {
    charges.value = charges.value.map((c) => (c.pk === chargePk ? charge : c));
  }

  /** The only in-place change: a name has no accounting effect. */
  async function rename(chargePk: string, name: string) {
    const { data } = await api.patch<FixedCharge>(url(chargePk), { name });
    replace(chargePk, data);
    return data;
  }

  /** Closes the charge the day before effective_date and opens its successor. */
  async function revise(chargePk: string, revision: FixedChargeRevision) {
    const { data } = await api.post<FixedCharge>(
      url(chargePk, "revise/"),
      revision,
    );
    replace(chargePk, data);
    return data;
  }

  /** effectiveDate is the last day the charge applies. */
  async function close(chargePk: string, effectiveDate: string) {
    await api.post<FixedCharge>(url(chargePk, "close/"), {
      effective_date: effectiveDate,
    });
    charges.value = charges.value.filter((c) => c.pk !== chargePk);
  }

  return { charges, load, create, rename, revise, close };
});
