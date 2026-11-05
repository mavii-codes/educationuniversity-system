import { queryDb } from "../config/database";

type AuditLogRow = {
  id: string;
  created_at: Date;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
};

export async function findAuditLogs(limit = 500): Promise<AuditLogRow[]> {
  const result = await queryDb<AuditLogRow>(
    `SELECT audit.id::text,
            audit.created_at,
            audit.actor_user_id,
            users.name AS actor_name,
            users.role AS actor_role,
            audit.action,
            audit.entity_type,
            audit.entity_id,
            audit.metadata
       FROM audit_log AS audit
       LEFT JOIN users ON users.id = audit.actor_user_id
      ORDER BY audit.created_at DESC, audit.id DESC
      LIMIT $1`,
    [limit]
  );
  return result.rows;
}
