"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  queueMutation,
  getPendingMutations,
  getFailedMutations,
  removeMutation,
  updateMutation,
  getPendingCount,
  MAX_RETRIES,
  type PendingMutation,
} from "./offlineQueue";

/**
 * Hook that provides offline-aware data mutation.
 *
 * - When online: writes directly to Supabase
 * - When offline: queues to IndexedDB
 * - When coming back online: replays queued mutations
 * - Mutations that fail MAX_RETRIES times land in `failedMutations`
 *   so the UI can surface them to the user instead of retrying forever.
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [failedMutations, setFailedMutations] = useState<PendingMutation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshCounts = useCallback(async () => {
    try {
      const [pending, failed] = await Promise.all([
        getPendingCount(),
        getFailedMutations(),
      ]);
      setPendingCount(pending);
      setFailedMutations(failed);
    } catch {
      // IDB may be unavailable (private browsing, etc.)
    }
  }, []);

  // Track online/offline status
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      replayQueue();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Check pending + failed counts on mount
    refreshCounts();

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replay queued mutations
  const replayQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const mutations = await getPendingMutations();
      if (mutations.length === 0) {
        await refreshCounts();
        return;
      }

      const supabase = createClient();

      for (const mutation of mutations) {
        try {
          if (mutation.operation === "insert") {
            const { error } = await supabase
              .from(mutation.table)
              .insert(mutation.data);
            if (error) throw error;
          } else if (mutation.operation === "update" && mutation.filter) {
            const { error } = await supabase
              .from(mutation.table)
              .update(mutation.data)
              .eq(mutation.filter.column, mutation.filter.value);
            if (error) throw error;
          } else if (mutation.operation === "delete" && mutation.filter) {
            const { error } = await supabase
              .from(mutation.table)
              .delete()
              .eq(mutation.filter.column, mutation.filter.value);
            if (error) throw error;
          }

          // Success — remove from queue
          if (mutation.id !== undefined) {
            await removeMutation(mutation.id);
          }
        } catch (err) {
          // Increment retry count; once we cross MAX_RETRIES the record
          // becomes a dead-letter surfaced via `failedMutations`.
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Offline sync failed for ${mutation.table}:`, message);
          if (mutation.id !== undefined) {
            const nextCount = (mutation.retryCount ?? 0) + 1;
            await updateMutation(mutation.id, {
              retryCount: nextCount,
              lastError: message,
              lastAttemptAt: new Date().toISOString(),
            });
          }
        }
      }

      await refreshCounts();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshCounts]);

  /** User-triggered discard of a dead-letter mutation. */
  const discardFailed = useCallback(
    async (id: number) => {
      await removeMutation(id);
      await refreshCounts();
    },
    [refreshCounts]
  );

  /** Retry a failed mutation by resetting its retryCount and replaying. */
  const retryFailed = useCallback(
    async (id: number) => {
      await updateMutation(id, { retryCount: 0, lastError: undefined });
      await refreshCounts();
      await replayQueue();
    },
    [refreshCounts, replayQueue]
  );

  /**
   * Insert a row — writes to Supabase if online, queues if offline.
   * Returns true if the write succeeded (or was queued).
   */
  const offlineInsert = useCallback(
    async (table: string, data: Record<string, unknown>): Promise<boolean> => {
      if (navigator.onLine) {
        try {
          const supabase = createClient();
          const { error } = await supabase.from(table).insert(data);
          if (error) throw error;
          return true;
        } catch {
          // Network error despite navigator.onLine — queue it
        }
      }

      // Queue for later
      await queueMutation({
        table,
        operation: "insert",
        data,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      });
      await refreshCounts();
      return true;
    },
    [refreshCounts]
  );

  return {
    isOnline,
    pendingCount,
    failedMutations,
    failedCount: failedMutations.length,
    syncing,
    maxRetries: MAX_RETRIES,
    syncNow: replayQueue,
    offlineInsert,
    discardFailed,
    retryFailed,
  };
}
