import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { db, type Shift } from "@/services/db";
import {
  resolveShiftRoute,
  ShiftAlreadyOpenError,
  useShiftStore,
} from "@/stores/shift";
import { OrderStatus } from "@/utils/constant";
import { clearDb } from "@/test/db";

function shift(pk: string, overrides: Partial<Shift> = {}): Shift {
  return {
    pk,
    restaurant: "r1",
    date: "2026-10-25T10:00:00.000Z",
    ended_at: null,
    vat_rate: 0,
    is_synced: false,
    ...overrides,
  };
}

function order(pk: string, status: OrderStatus) {
  return {
    pk,
    shift: "s1",
    customer_name: "Jean",
    picking_time: "2026-10-25T12:00:00.000Z",
    status,
    is_synced: false,
  };
}

describe("useShiftStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await clearDb();
    await db.restaurants.bulkAdd([
      { pk: "r1", name: "Chez Toto", vat_rate: 10 },
      { pk: "r2", name: "Autre", vat_rate: 0 },
    ]);
  });

  it("finds the open shift of a restaurant", async () => {
    await db.shifts.bulkAdd([
      shift("closed", { ended_at: "2026-10-24T18:00:00.000Z" }),
      shift("open"),
      shift("other", { restaurant: "r2" }),
    ]);
    const store = useShiftStore();

    expect((await store.currentOpenShift("r1"))?.pk).toBe("open");
  });

  it("finds no open shift when all of them are closed", async () => {
    await db.shifts.bulkAdd([
      shift("closed", { ended_at: "2026-10-24T18:00:00.000Z" }),
      shift("other", { restaurant: "r2" }),
    ]);
    const store = useShiftStore();

    expect(await store.currentOpenShift("r1")).toBeNull();
  });

  it("starts a shift that freezes the restaurant VAT rate", async () => {
    const store = useShiftStore();

    const started = await store.startShift("r1");
    await db.restaurants.update("r1", { vat_rate: 20 });

    expect(started.ended_at).toBeNull();
    expect(started.vat_rate).toBe(10);
    expect(await store.currentOpenShift("r1")).toEqual(started);
  });

  it("refuses to start a second open shift in a restaurant", async () => {
    await db.shifts.add(shift("open"));
    const store = useShiftStore();

    await expect(store.startShift("r1")).rejects.toBeInstanceOf(
      ShiftAlreadyOpenError,
    );
    expect(await db.shifts.count()).toBe(1);
  });

  it("starts a shift while another restaurant has one open", async () => {
    await db.shifts.add(shift("other", { restaurant: "r2" }));
    const store = useShiftStore();

    await store.startShift("r1");

    expect(await db.shifts.count()).toBe(2);
  });

  it("ends a shift, which allows starting the next one", async () => {
    await db.shifts.add(shift("s1"));
    const store = useShiftStore();

    await store.endShift("s1");

    expect((await db.shifts.get("s1"))!.ended_at).not.toBeNull();
    expect(await store.currentOpenShift("r1")).toBeNull();
    await expect(store.startShift("r1")).resolves.toBeDefined();
  });

  it("leaves unfinished orders as they are by default", async () => {
    await db.shifts.add(shift("s1"));
    await db.orders.bulkAdd([
      order("o1", OrderStatus.todo),
      order("o2", OrderStatus.done),
    ]);
    const store = useShiftStore();

    await store.endShift("s1");

    expect((await db.orders.get("o1"))!.status).toBe(OrderStatus.todo);
  });

  it("can mark every order done when ending a shift", async () => {
    await db.shifts.add(shift("s1"));
    await db.orders.bulkAdd([
      order("o1", OrderStatus.todo),
      order("o2", OrderStatus.inProgress),
      order("o3", OrderStatus.done),
      { ...order("o4", OrderStatus.todo), shift: "s2" },
    ]);
    const store = useShiftStore();

    await store.endShift("s1", { markAllDone: true });

    const statuses = (await db.orders.toArray()).map((o) => [o.pk, o.status]);
    expect(statuses).toEqual([
      ["o1", OrderStatus.done],
      ["o2", OrderStatus.done],
      ["o3", OrderStatus.done],
      ["o4", OrderStatus.todo],
    ]);
    expect((await db.shifts.get("s1"))!.ended_at).not.toBeNull();
  });
});

describe("resolveShiftRoute", () => {
  beforeEach(async () => {
    await clearDb();
    await db.shifts.bulkAdd([
      shift("open"),
      shift("closed", { ended_at: "2026-10-24T18:00:00.000Z" }),
      shift("other", { restaurant: "r2" }),
    ]);
  });

  it("opens the open shift of the restaurant", async () => {
    expect(await resolveShiftRoute("r1", "open")).toBeUndefined();
  });

  it("sends anything else back to the restaurant", async () => {
    for (const shiftId of ["closed", "other", "unknown"]) {
      expect(await resolveShiftRoute("r1", shiftId)).toBe("/restaurants/r1");
    }
  });
});
