"use client";

/**
 * Storage + sync layer for the migraine tracker tool.
 *
 * Three tiers, each optional and layered on the one below:
 *   1. localStorage        — always on, works signed-out and offline.
 *   2. Supabase profile    — when signed in, the log follows you across
 *                            devices (the "tracking in profile" tier).
 *   3. Google Drive file   — an explicit backup file in the user's own Drive,
 *                            written with the drive.file scope.
 *
 * The log itself is a single JSON blob: { entries, preventive, lastExport }.
 * That mirrors how the original artifact serialised to window.storage, so the
 * export/restore/CSV code carries over unchanged.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const LOCAL_KEY = "migraine-record:v1";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_FILE_NAME = "vedawell-migraine-record.json";
const DRIVE_MARKER = { migraineRecord: "1" }; // appProperties tag to find our file

export interface MigraineEntry {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    ongoing: boolean;
    severity: number;
    side: string;
    symptoms: string[];
    triggers: string[];
    meds: string;
    medHelped: string;
    impact: string;
    notes: string;
}

export interface MigraineLog {
    entries: MigraineEntry[];
    preventive: string;
    lastExport: string;
}

export type SyncTier = "local" | "cloud";
export type SyncState = "idle" | "loading" | "saving" | "saved" | "error";

const EMPTY_LOG: MigraineLog = { entries: [], preventive: "", lastExport: "" };

/** Merge two logs by entry id (union, incoming wins on id clash). */
export function mergeLogs(a: MigraineLog, b: MigraineLog): MigraineLog {
    const byId: Record<string, MigraineEntry> = {};
    for (const e of a.entries) if (e && e.id) byId[e.id] = e;
    for (const e of b.entries) if (e && e.id) byId[e.id] = e;
    const entries = Object.values(byId).sort((x, y) =>
        (y.date + y.startTime).localeCompare(x.date + x.startTime));
    return {
        entries,
        preventive: b.preventive || a.preventive || "",
        lastExport: b.lastExport > a.lastExport ? b.lastExport : (a.lastExport || b.lastExport || ""),
    };
}

function readLocal(): MigraineLog {
    if (typeof window === "undefined") return { ...EMPTY_LOG };
    try {
        const raw = window.localStorage.getItem(LOCAL_KEY);
        if (!raw) return { ...EMPTY_LOG };
        const data = JSON.parse(raw);
        return {
            entries: Array.isArray(data.entries) ? data.entries : [],
            preventive: data.preventive || "",
            lastExport: data.lastExport || "",
        };
    } catch {
        return { ...EMPTY_LOG };
    }
}

function writeLocal(log: MigraineLog) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(LOCAL_KEY, JSON.stringify(log));
    } catch {
        /* private-mode / quota — the in-memory state is still the source of truth */
    }
}

async function readCloud(supabase: SupabaseClient, userId: string): Promise<MigraineLog | null> {
    const { data, error } = await supabase
        .from("migraine_logs")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();
    if (error) {
        console.error("[migraine-sync] cloud read failed:", error.message);
        return null;
    }
    const d = (data?.data ?? {}) as Partial<MigraineLog>;
    return {
        entries: Array.isArray(d.entries) ? d.entries : [],
        preventive: d.preventive || "",
        lastExport: d.lastExport || "",
    };
}

async function writeCloud(supabase: SupabaseClient, userId: string, log: MigraineLog): Promise<boolean> {
    const { error } = await supabase
        .from("migraine_logs")
        .upsert({ user_id: userId, data: log }, { onConflict: "user_id" });
    if (error) {
        console.error("[migraine-sync] cloud write failed:", error.message);
        return false;
    }
    return true;
}

/* ------------------------------------------------------------------ *
 * Google Drive — write/update one backup file in the user's Drive
 * ------------------------------------------------------------------ */

export interface DriveResult {
    ok: boolean;
    needsConnect?: boolean;   // no usable provider token — user must connect Drive
    error?: string;
}

async function findDriveFile(token: string): Promise<string | null> {
    const q = encodeURIComponent(
        `name='${DRIVE_FILE_NAME}' and appProperties has { key='migraineRecord' and value='1' } and trashed=false`
    );
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id)`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Drive search ${res.status}`);
    const body = await res.json();
    return body.files?.[0]?.id ?? null;
}

/** Multipart create-or-update of the JSON backup file. */
async function uploadDriveFile(token: string, fileId: string | null, log: MigraineLog): Promise<void> {
    const metadata: Record<string, unknown> = {
        name: DRIVE_FILE_NAME,
        mimeType: "application/json",
        appProperties: DRIVE_MARKER,
    };
    // On update we must not resend parents/appProperties changes that conflict.
    const boundary = "vedawell-" + Math.random().toString(36).slice(2);
    const body =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(fileId ? { name: DRIVE_FILE_NAME } : metadata) +
        `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        JSON.stringify(log) +
        `\r\n--${boundary}--`;

    const url = fileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const res = await fetch(url, {
        method: fileId ? "PATCH" : "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Drive upload ${res.status}: ${txt.slice(0, 120)}`);
    }
}

/* ================================================================== *
 * The hook the tool uses
 * ================================================================== */
export function useMigraineSync() {
    const supabaseRef = useRef<SupabaseClient | null>(null);
    if (supabaseRef.current === null) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    const [user, setUser] = useState<User | null>(null);
    const [log, setLogState] = useState<MigraineLog>(EMPTY_LOG);
    const [loaded, setLoaded] = useState(false);
    const [syncState, setSyncState] = useState<SyncState>("idle");
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const userIdRef = useRef<string | null>(null);
    // Mirror of `log` so persist() can resolve functional updates against the
    // freshest value without a stale render closure.
    const logRef = useRef<MigraineLog>(EMPTY_LOG);
    const setLogInternal = useCallback((next: MigraineLog) => {
        logRef.current = next;
        setLogState(next);
    }, []);

    /* ---- initial load: local first (instant), then reconcile with cloud ---- */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const local = readLocal();
            if (!cancelled) setLogInternal(local);

            const { data: { user: u } } = await supabase.auth.getUser();
            if (cancelled) return;
            setUser(u ?? null);
            userIdRef.current = u?.id ?? null;

            if (u) {
                setSyncState("loading");
                const cloud = await readCloud(supabase, u.id);
                if (cancelled) return;
                if (cloud) {
                    // First sign-in with local-only data: fold it up to the cloud.
                    const merged = mergeLogs(cloud, local);
                    setLogInternal(merged);
                    writeLocal(merged);
                    // Persist the merge so both sides agree.
                    if (merged.entries.length !== cloud.entries.length) {
                        await writeCloud(supabase, u.id, merged);
                    }
                    setSyncState("saved");
                } else {
                    setSyncState("error");
                }
            }
            if (!cancelled) setLoaded(true);
        })();
        return () => { cancelled = true; };
    }, [supabase]);

    /* ---- react to auth changes inside the tab ---- */
    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            userIdRef.current = u?.id ?? null;

            // INITIAL_SESSION is already handled by the load effect; TOKEN_REFRESHED
            // just keeps the same user — neither needs a fresh cloud re-merge (which
            // would flash the UI). Only a real sign-in folds local data up to cloud.
            if (event === "SIGNED_IN" && u) {
                setSyncState("loading");
                const cloud = await readCloud(supabase, u.id);
                const local = readLocal();
                const merged = mergeLogs(cloud ?? EMPTY_LOG, local);
                setLogInternal(merged);
                writeLocal(merged);
                await writeCloud(supabase, u.id, merged);
                setSyncState("saved");
            } else if (event === "SIGNED_OUT") {
                setSyncState("idle");
            }
        });
        return () => sub.subscription.unsubscribe();
    }, [supabase, setLogInternal]);

    /* ---- persist on every change (debounced) ---- */
    const persist = useCallback((update: MigraineLog | ((prev: MigraineLog) => MigraineLog)) => {
        const next = typeof update === "function"
            ? (update as (p: MigraineLog) => MigraineLog)(logRef.current)
            : update;
        setLogInternal(next);
        writeLocal(next);
        const uid = userIdRef.current;
        if (!uid) return;
        setSyncState("saving");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            const ok = await writeCloud(supabase, uid, next);
            setSyncState(ok ? "saved" : "error");
        }, 700);
    }, [supabase, setLogInternal]);

    /* ---- Google Drive ---- */
    const connectDrive = useCallback(async () => {
        const redirectTo = typeof window !== "undefined"
            ? `${window.location.origin}/tools/migraine-tracker?drive=connected`
            : undefined;
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                scopes: DRIVE_SCOPE,
                redirectTo,
                queryParams: { access_type: "offline", prompt: "consent" },
            },
        });
    }, [supabase]);

    const pushToDrive = useCallback(async (current: MigraineLog): Promise<DriveResult> => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.provider_token;
        if (!token) return { ok: false, needsConnect: true };
        try {
            const fileId = await findDriveFile(token);
            await uploadDriveFile(token, fileId, current);
            return { ok: true };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            // A 401/403 means the token is stale or lacks the scope — reconnect.
            if (/40[13]/.test(msg)) return { ok: false, needsConnect: true, error: msg };
            return { ok: false, error: msg };
        }
    }, [supabase]);

    return {
        user,
        signedIn: !!user,
        log,
        setLog: persist,
        loaded,
        syncState,
        connectDrive,
        pushToDrive,
    };
}
