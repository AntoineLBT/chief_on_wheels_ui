import { db } from "@/services/db";
import { isPendingSync, sync } from "@/services/sync";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSyncStore = defineStore("sync", () => {
  const isSyncing = ref(false);
  const pendingCount = ref(0);

  async function refreshPendingCount() {
    const all = await db.shifts.toArray();
    pendingCount.value = all.filter(isPendingSync).length;
  }

  async function syncAll() {
    isSyncing.value = true;
    try {
      await sync();
    } finally {
      // Also after a failure: shifts sent before it are synced, and the sync
      // button must not stay stuck in its loading state.
      await refreshPendingCount();
      isSyncing.value = false;
    }
  }

  return { isSyncing, pendingCount, refreshPendingCount, syncAll };
});
