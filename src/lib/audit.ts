import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
export type AuditEntity = "Patient" | "Sale" | "Appointment" | "Expense";

interface AuditLogParams {
  organizationId: string;
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
}

/**
 * Logs an audit event for tracking changes to critical data
 *
 * @param params - The audit log parameters
 * @returns The created audit log entry
 *
 * @example
 * // Log a delete action
 * await logAudit({
 *   organizationId: session.user.organizationId,
 *   userId: session.user.id,
 *   action: "DELETE",
 *   entity: "Patient",
 *   entityId: patientId,
 *   oldData: { fullName: patient.fullName, phone: patient.phone },
 * });
 */
export async function logAudit({
  organizationId,
  userId,
  action,
  entity,
  entityId,
  oldData = null,
  newData = null,
}: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        entity,
        entityId,
        oldData: oldData ?? undefined,
        newData: newData ?? undefined,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main operation
    console.error("Error creating audit log:", error);
    return null;
  }
}

/**
 * Helper to serialize entity data for audit logging
 * Removes sensitive fields and circular references
 */
export function serializeForAudit<T extends Record<string, unknown>>(
  data: T,
  excludeFields: string[] = ["passwordHash", "resetToken"]
): Prisma.InputJsonValue {
  const serialized: Record<string, Prisma.InputJsonValue | null> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip excluded fields
    if (excludeFields.includes(key)) continue;

    // Handle Date objects
    if (value instanceof Date) {
      serialized[key] = value.toISOString();
    }
    // Handle Decimal (Prisma)
    else if (value && typeof value === "object" && "toNumber" in value) {
      serialized[key] = (value as { toNumber: () => number }).toNumber();
    }
    // Handle null
    else if (value === null) {
      serialized[key] = null;
    }
    // Skip undefined
    else if (value === undefined) {
      continue;
    }
    // Handle primitives
    else if (typeof value !== "object") {
      serialized[key] = value as Prisma.InputJsonValue;
    }
    // Skip nested objects/relations to avoid circular refs
  }

  return serialized;
}
