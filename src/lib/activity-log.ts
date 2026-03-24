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
 * Log an activity event. Fire-and-forget — errors are silently caught.
 * Call without `await` in the main code path.
 */
export function logActivity(
  supabase: { from: (table: string) => { insert: (row: Record<string, unknown>) => { then: Function } } },
  params: LogActivityParams
): void {
  const { projectId, userId, action, entityType, entityId, oldValues, newValues, metadata } = params;

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
    .then(() => {})
    .catch?.((err: unknown) => {
      console.error("[activity-log] Failed to log:", err);
    });
}
