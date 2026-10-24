import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import api from "@/services/apiClient";
import { type FixedCharge, useFixedChargeStore } from "@/stores/fixedCharge";
import { FixedChargeFrequency } from "@/utils/constant";

vi.mock("@/services/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

function charge(pk: string, overrides: Partial<FixedCharge> = {}) {
  return {
    pk,
    restaurant: "r1",
    name: "Loyer",
    amount: 300,
    frequency: FixedChargeFrequency.monthly,
    start_date: "2026-01-01",
    end_date: null,
    ...overrides,
  };
}

async function loadedStore(charges: FixedCharge[]) {
  vi.mocked(api.get).mockResolvedValue({ data: charges });
  const store = useFixedChargeStore();
  await store.load("r1");
  return store;
}

describe("useFixedChargeStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it("loads the active charges of a restaurant from the server", async () => {
    const store = await loadedStore([charge("c1")]);

    expect(api.get).toHaveBeenCalledWith("/restaurants/r1/fixed-charges/");
    expect(store.charges).toEqual([charge("c1")]);
  });

  it("creates a charge on the server", async () => {
    const store = await loadedStore([charge("c1")]);
    vi.mocked(api.post).mockResolvedValue({ data: charge("c2") });

    const input = {
      name: "Loyer",
      amount: 300,
      frequency: FixedChargeFrequency.monthly,
      start_date: "2026-01-01",
    };
    await store.create("r1", input);

    expect(api.post).toHaveBeenCalledWith(
      "/restaurants/r1/fixed-charges/",
      input,
    );
    expect(store.charges.map((c) => c.pk)).toEqual(["c1", "c2"]);
  });

  it("renames a charge in place", async () => {
    const store = await loadedStore([charge("c1"), charge("c2")]);
    const renamed = charge("c1", { name: "Loyer emplacement" });
    vi.mocked(api.patch).mockResolvedValue({ data: renamed });

    await store.rename("c1", "Loyer emplacement");

    expect(api.patch).toHaveBeenCalledWith(
      "/restaurants/r1/fixed-charges/c1/",
      {
        name: "Loyer emplacement",
      },
    );
    expect(store.charges).toEqual([renamed, charge("c2")]);
  });

  it("replaces a revised charge with its successor", async () => {
    const store = await loadedStore([charge("c1"), charge("c2")]);
    const successor = charge("c3", { amount: 350, start_date: "2026-07-01" });
    vi.mocked(api.post).mockResolvedValue({ data: successor });

    await store.revise("c1", { amount: 350, effective_date: "2026-07-01" });

    expect(api.post).toHaveBeenCalledWith(
      "/restaurants/r1/fixed-charges/c1/revise/",
      { amount: 350, effective_date: "2026-07-01" },
    );
    expect(store.charges).toEqual([successor, charge("c2")]);
  });

  it("removes a closed charge from the active ones", async () => {
    const store = await loadedStore([charge("c1"), charge("c2")]);
    vi.mocked(api.post).mockResolvedValue({
      data: charge("c1", { end_date: "2026-06-30" }),
    });

    await store.close("c1", "2026-06-30");

    expect(api.post).toHaveBeenCalledWith(
      "/restaurants/r1/fixed-charges/c1/close/",
      { effective_date: "2026-06-30" },
    );
    expect(store.charges.map((c) => c.pk)).toEqual(["c2"]);
  });

  it("keeps the charges when the server refuses a change", async () => {
    const store = await loadedStore([charge("c1")]);
    vi.mocked(api.post).mockRejectedValue(new Error("Network Error"));

    await expect(store.close("c1", "2026-06-30")).rejects.toThrow(
      "Network Error",
    );
    await expect(store.revise("c1", { amount: 350 })).rejects.toThrow(
      "Network Error",
    );

    expect(store.charges).toEqual([charge("c1")]);
  });
});
