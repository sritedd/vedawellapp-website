"use client";

/**
 * Offline queue using IndexedDB.
 * Stores pending Supabase mutations when offline, replays them when back online.
 */

const DB_NAME = "vedawell-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending_mutations";

export const MAX_RETRIES = 5;

export interface PendingMutation {
  id?: number; // auto-increment key
  table: string;
  operation: "insert" | "update" | "delete";
  data: Record<string, unknown>;
  filter?: { column: string; value: string }; // for update/delete
  createdAt: string;
  retryCount?: number;
  lastError?: string;
  lastAttemptAt?: string;
}

export function isFailed(mutation: PendingMutation): boolean {
  return (mutation.retryCount ?? 0) >= MAX_RETRIES;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Queue a mutation for later replay */
export async function queueMutation(mutation: PendingMutation): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(mutation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all mutations still eligible for retry (retryCount < MAX_RETRIES) */
export async function getPendingMutations(): Promise<PendingMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const all = request.result as PendingMutation[];
      resolve(all.filter((m) => !isFailed(m)));
    };
    request.onerror = () => reject(request.error);
  });
}

/** Get mutations that exceeded MAX_RETRIES and need user action */
export async function getFailedMutations(): Promise<PendingMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const all = request.result as PendingMutation[];
      resolve(all.filter(isFailed));
    };
    request.onerror = () => reject(request.error);
  });
}

/** Remove a mutation after successful replay (or user-confirmed discard) */
export async function removeMutation(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Update an existing mutation (used to increment retryCount, record lastError) */
export async function updateMutation(
  id: number,
  updates: Partial<PendingMutation>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as PendingMutation | undefined;
      if (!existing) {
        resolve();
        return;
      }
      store.put({ ...existing, ...updates, id });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get count of mutations still eligible for retry */
export async function getPendingCount(): Promise<number> {
  const pending = await getPendingMutations();
  return pending.length;
}

/** Get count of failed mutations that exceeded MAX_RETRIES */
export async function getFailedCount(): Promise<number> {
  const failed = await getFailedMutations();
  return failed.length;
}

/** Clear all pending mutations */
export async function clearAllMutations(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
