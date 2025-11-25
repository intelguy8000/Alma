import { prisma } from "@/lib/prisma";

export const REAL_MODE_SETTING_KEY = "real_mode";

export async function isRealModeEnabled(organizationId: string): Promise<boolean> {
  try {
    const setting = await prisma.setting.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: REAL_MODE_SETTING_KEY,
        },
      },
    });
    return setting?.value === "true";
  } catch (error) {
    console.error("Error checking real mode:", error);
    return false;
  }
}

// Helper to get patient IDs that have at least one sale with electronic invoice
export async function getPatientIdsWithInvoice(organizationId: string): Promise<string[]> {
  const salesWithInvoice = await prisma.sale.findMany({
    where: {
      organizationId,
      hasElectronicInvoice: true,
      appointment: {
        isNot: null,
      },
    },
    select: {
      appointment: {
        select: {
          patientId: true,
        },
      },
    },
  });

  const patientIds = new Set<string>();
  salesWithInvoice.forEach((sale) => {
    if (sale.appointment?.patientId) {
      patientIds.add(sale.appointment.patientId);
    }
  });

  return Array.from(patientIds);
}
