import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { db } from "@/services/db";
import { useShiftStore } from "@/stores/shift";
import { clearDb } from "@/test/db";

describe("useShiftStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await clearDb();
  });

  it("freezes the restaurant VAT rate on the new shift", async () => {
    await db.restaurants.add({ pk: "r1", name: "Chez Toto", vat_rate: 10 });
    const store = useShiftStore();

    const shift = await store.createShift("r1");
    await db.restaurants.update("r1", { vat_rate: 20 });

    expect(shift.vat_rate).toBe(10);
    expect((await db.shifts.get(shift.pk))!.vat_rate).toBe(10);
  });
});
