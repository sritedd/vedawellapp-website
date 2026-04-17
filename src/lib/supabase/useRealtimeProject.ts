"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Subscribe to Supabase Realtime changes on a project's tables.
 * When any row matching the projectId changes (from another tab/device),
 * the onChanged callback fires so the UI can refresh.
 *
 * Tables monitored: projects, stages, defects, variations, inspections,
 * certifications, communication_log, progress_photos, payments,
 * pre_handover_items, checklist_items, weekly_checkins, documents
 */

const WATCHED_TABLES = [
  "projects",
  "stages",
  "defects",
  "variations",
  "inspections",
  "certifications",
  "communication_log",
  "progress_photos",
  "payments",
  "pre_handover_items",
  "contract_review_items",
  "builder_reviews",
  "weekly_checkins",
  "documents",
] as const;

export function useRealtimeProject(
  projectId: string | undefined,
  onChanged: () => void
) {
  const onChangedRef = useRef(onChanged);

  // Keep the latest callback in a ref WITHOUT writing during render.
  // useLayoutEffect runs synchronously after DOM mutations but before paint,
  // so the ref is updated before any subscription callback can fire.
  useLayoutEffect(() => {
    onChangedRef.current = onChanged;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    const channel = supabase.channel(`project-${projectId}`);

    const handleChange = (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          Promise.resolve(onChangedRef.current()).catch((err) =>
            console.error("[Realtime] Sync callback failed:", err)
          );
        } catch (err) {
          console.error("[Realtime] Sync callback failed:", err);
        }
      }, 500);
    };

    for (const table of WATCHED_TABLES) {
      const filterCol = table === "projects" ? "id" : "project_id";

      // Supabase JS overload signature for postgres_changes is loose;
      // using a typed callback above keeps the call site safe.
      channel.on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table,
          filter: `${filterCol}=eq.${projectId}`,
        },
        handleChange
      );
    }

    channel.subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [projectId]);
}
