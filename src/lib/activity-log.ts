/**
 * Activity logging utility — fire-and-forget, append-only audit trail.
 */

export type ActivityAction =
  | "defect.created" | "defect.updated" | "defect.resolved"
  | "payment.created" | "payment.updated"
  | "certificate.uploaded"
  | "variation.created" | "variation.signed"
  | "stage.advanced"
  | "communication.logged"
  | "project.created" | "project.updated" | "project.deleted"
  | "inspection.scheduled" | "inspection.completed"
  | "escalation.started" | "escalation.advanced";

interface LogActivityParams {
  projectId: string;
  userId: string;
  action: ActivityAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Minimal Supabase shape we need for the fire-and-forget insert.
 * `insert(...)` returns a thenable (Supabase's PostgrestBuilder) that
 * resolves to `{ data, error }`; we only consume `error` here.
 */
type InsertThenable = {
  then: (
    onFulfilled?: (value: { error: unknown }) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => PromiseLike<unknown>;
};

// Structural — accepts both the real `SupabaseClient` and the dev mock. Avoids
// importing the heavy generic from @supabase/supabase-js for a single insert call.
type SupabaseInsertable = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => InsertThenable;
  };
};

/**
 * Log an activity event. Fire-and-forget — errors are logged, never thrown.
 * Call without `await` in the main code path.
 */
export function logActivity(
  supabase: SupabaseInsertable,
  params: LogActivityParams
): void {
  const { projectId, userId, action, entityType, entityId, oldValues, newValues, metadata } = params;

  Promise.resolve(
    supabase
      .from("activity_log")
      .insert({
        project_id: projectId,
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        old_values: oldValues || null,
        new_values: newValues || null,
        metadata: metadata || null,
      })
  ).then(
    (result) => {
      const error = (result as { error?: unknown } | undefined)?.error;
      if (error) console.error("[activity-log] Insert returned error:", error);
    },
    (err) => console.error("[activity-log] Failed to log:", err)
  );
}
