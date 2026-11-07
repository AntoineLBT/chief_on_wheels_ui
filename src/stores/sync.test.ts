import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import api from "@/services/apiClient";
import { db } from "@/services/db";
import { useSyncStore } from "@/stores/sync";
import { clearDb } from "@/test/db";

vi.mock("@/services/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe("useSyncStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
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

  it("stops syncing when the sync fails, leaving the shift pending", async () => {
    await db.shifts.add({
      pk: "pending",
      restaurant: "r1",
      date: "2026-10-24T10:00:00.000Z",
      ended_at: "2026-10-24T18:00:00.000Z",
      vat_rate: 0,
      is_synced: false,
    });
    vi.mocked(api.post).mockRejectedValue(new Error("Network Error"));
    const store = useSyncStore();
    await store.refreshPendingCount();

    await expect(store.syncAll()).rejects.toThrow("Network Error");

    expect(store.isSyncing).toBe(false);
    expect(store.pendingCount).toBe(1);
  });
});
