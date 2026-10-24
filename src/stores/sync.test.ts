import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { db } from "@/services/db";
import { useSyncStore } from "@/stores/sync";
import { clearDb } from "@/test/db";

describe("useSyncStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await clearDb();
  });

  it("only counts closed shifts waiting for a sync", async () => {
    const shift = (
      pk: string,
      ended_at: string | null,
      is_synced: boolean,
    ) => ({
      pk,
      restaurant: "r1",
      date: "2026-10-24T10:00:00.000Z",
      ended_at,
      vat_rate: 0,
      is_synced,
    });
    await db.shifts.bulkAdd([
      shift("pending", "2026-10-24T18:00:00.000Z", false),
      shift("synced", "2026-10-23T18:00:00.000Z", true),
      shift("open", null, false),
    ]);
    const store = useSyncStore();

    await store.refreshPendingCount();

    expect(store.pendingCount).toBe(1);
  });
});
