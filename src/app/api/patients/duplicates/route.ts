import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface DuplicatePatient {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string | null;
  whatsapp: string | null;
  appointmentCount: number;
  duplicateOf: string; // Name of the patient they're duplicated with
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get all active patients with phone or whatsapp
    const patients = await prisma.patient.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { phone: { not: null, notIn: [""] } },
          { whatsapp: { not: null, notIn: [""] } },
        ],
      },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Find duplicates by grouping by phone/whatsapp
    const phoneMap = new Map<string, typeof patients>();
    const whatsappMap = new Map<string, typeof patients>();

    for (const patient of patients) {
      // Normalize phone numbers (remove spaces, dashes, etc.)
      const normalizedPhone = patient.phone?.replace(/\D/g, "") || "";
      const normalizedWhatsapp = patient.whatsapp?.replace(/\D/g, "") || "";

      if (normalizedPhone) {
        const existing = phoneMap.get(normalizedPhone) || [];
        existing.push(patient);
        phoneMap.set(normalizedPhone, existing);
      }

      if (normalizedWhatsapp && normalizedWhatsapp !== normalizedPhone) {
        const existing = whatsappMap.get(normalizedWhatsapp) || [];
        existing.push(patient);
        whatsappMap.set(normalizedWhatsapp, existing);
      }
    }

    // Collect duplicates
    const duplicates: DuplicatePatient[] = [];
    const processedIds = new Set<string>();

    // Process phone duplicates
    for (const [, patientsWithSamePhone] of phoneMap) {
      if (patientsWithSamePhone.length > 1) {
        // Sort by creation date - first one is the "original"
        const sorted = patientsWithSamePhone.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const original = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
          const duplicate = sorted[i];
          if (!processedIds.has(duplicate.id)) {
            duplicates.push({
              id: duplicate.id,
              patientCode: duplicate.patientCode,
              fullName: duplicate.fullName,
              phone: duplicate.phone,
              whatsapp: duplicate.whatsapp,
              appointmentCount: duplicate._count.appointments,
              duplicateOf: original.fullName,
            });
            processedIds.add(duplicate.id);
          }
        }
      }
    }

    // Process whatsapp duplicates (only if not already processed)
    for (const [, patientsWithSameWhatsapp] of whatsappMap) {
      if (patientsWithSameWhatsapp.length > 1) {
        const sorted = patientsWithSameWhatsapp.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const original = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
          const duplicate = sorted[i];
          if (!processedIds.has(duplicate.id)) {
            duplicates.push({
              id: duplicate.id,
              patientCode: duplicate.patientCode,
              fullName: duplicate.fullName,
              phone: duplicate.phone,
              whatsapp: duplicate.whatsapp,
              appointmentCount: duplicate._count.appointments,
              duplicateOf: original.fullName,
            });
            processedIds.add(duplicate.id);
          }
        }
      }
    }

    // Sort by patient code
    duplicates.sort((a, b) => a.patientCode.localeCompare(b.patientCode));

    return NextResponse.json(duplicates);
  } catch (error) {
    console.error("Error fetching duplicate patients:", error);
    return NextResponse.json(
      { error: "Error al obtener pacientes duplicados" },
      { status: 500 }
    );
  }
}
