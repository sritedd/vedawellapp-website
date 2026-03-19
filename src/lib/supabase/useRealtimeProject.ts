"use client";

import { useEffect, useRef } from "react";
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
  onChangedRef.current = onChanged;

  // Debounce: if multiple changes come in rapid succession, only refresh once
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    const channel = supabase.channel(`project-${projectId}`);

    for (const table of WATCHED_TABLES) {
      // For the "projects" table, filter on id; for others, filter on project_id
      const filterCol = table === "projects" ? "id" : "project_id";

      channel.on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table,
          filter: `${filterCol}=eq.${projectId}`,
        },
        () => {
          // Debounce rapid changes (e.g. bulk insert of checklist items)
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
        }
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
