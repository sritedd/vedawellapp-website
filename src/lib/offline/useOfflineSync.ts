"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  queueMutation,
  getPendingMutations,
  removeMutation,
  getPendingCount,
  type PendingMutation,
} from "./offlineQueue";

/**
 * Hook that provides offline-aware data mutation.
 *
 * - When online: writes directly to Supabase
 * - When offline: queues to IndexedDB
 * - When coming back online: replays queued mutations
 *
 * Returns: { isOnline, pendingCount, syncNow, offlineInsert }
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

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

    // Check pending count on mount
    getPendingCount().then(setPendingCount).catch(() => {});

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Replay queued mutations
  const replayQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const mutations = await getPendingMutations();
      if (mutations.length === 0) {
        setPendingCount(0);
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
          // If a single mutation fails, keep it in queue for next retry
          console.error(`Offline sync failed for ${mutation.table}:`, err);
        }
      }

      const remaining = await getPendingCount();
      setPendingCount(remaining);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

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
      });
      const count = await getPendingCount();
      setPendingCount(count);
      return true;
    },
    []
  );

  return {
    isOnline,
    pendingCount,
    syncing,
    syncNow: replayQueue,
    offlineInsert,
  };
}
