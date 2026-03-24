"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface LogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, string> = {
  "defect.created": "🐛",
  "defect.updated": "✏️",
  "defect.resolved": "✅",
  "payment.created": "💳",
  "payment.updated": "💰",
  "certificate.uploaded": "📜",
  "variation.created": "📝",
  "variation.signed": "✍️",
  "stage.advanced": "🚀",
  "communication.logged": "💬",
  "project.created": "🏠",
  "project.updated": "🔧",
  "project.deleted": "🗑️",
  "inspection.scheduled": "📅",
  "inspection.completed": "🔍",
  "escalation.started": "⚠️",
  "escalation.advanced": "🔺",
};

const ENTITY_FILTERS = [
  { value: "", label: "All" },
  { value: "defect", label: "Defects" },
  { value: "payment", label: "Payments" },
  { value: "certificate", label: "Certificates" },
  { value: "variation", label: "Variations" },
  { value: "stage", label: "Stages" },
  { value: "communication", label: "Comms" },
  { value: "escalation", label: "Escalations" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-AU");
}

function actionLabel(action: string): string {
  return action.replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ActivityLog({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 30;

  const fetchLogs = useCallback(async (reset = false) => {
    setLoading(true);
    const newOffset = reset ? 0 : offset;

    try {
      const supabase = createClient();
      let query = supabase
        .from("activity_log")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .range(newOffset, newOffset + PAGE_SIZE - 1);

      if (filter) {
        query = query.eq("entity_type", filter);
      }

      const { data } = await query;
      const items = data || [];

      if (reset) {
        setLogs(items);
        setOffset(items.length);
      } else {
        setLogs((prev) => [...prev, ...items]);
        setOffset(newOffset + items.length);
      }
      setHasMore(items.length === PAGE_SIZE);
    } catch (err) {
      console.error("[ActivityLog] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, filter, offset]);

  useEffect(() => {
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Activity Log</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm px-3 py-1.5 rounded border border-border bg-background"
        >
          {ENTITY_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {logs.length === 0 && !loading ? (
        <p className="text-muted text-sm py-8 text-center">No activity recorded yet.</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-0">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-10 py-3 group">
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary group-hover:bg-primary transition-colors" />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ACTION_ICONS[log.action] || "📋"}</span>
                      <span className="font-medium text-sm">{actionLabel(log.action)}</span>
                    </div>

                    {/* Show changed values for updates */}
                    {log.old_values && log.new_values && (
                      <div className="mt-1 text-xs text-muted">
                        {Object.keys(log.new_values).slice(0, 3).map((key) => (
                          <span key={key} className="mr-3">
                            {key}: <span className="line-through text-red-400">{String((log.old_values as Record<string, unknown>)?.[key] ?? "")}</span>
                            {" → "}
                            <span className="text-green-500">{String((log.new_values as Record<string, unknown>)[key])}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap">{timeAgo(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => fetchLogs(false)}
              disabled={loading}
              className="mt-4 w-full py-2 text-sm text-primary hover:underline disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}

      {loading && logs.length === 0 && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
