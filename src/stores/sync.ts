import { db } from "@/services/db";
import { sync } from "@/services/sync";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSyncStore = defineStore("sync", () => {
  const isSyncing = ref(false);
  const pendingCount = ref(0);

  async function refreshPendingCount() {
    const all = await db.shifts.toArray();
    pendingCount.value = all.filter((s) => !s.is_synced).length;
  }

  async function syncAll() {
    isSyncing.value = true;
    await sync();
    await refreshPendingCount();
    isSyncing.value = false;
  }

  return { isSyncing, pendingCount, refreshPendingCount, syncAll };
});
