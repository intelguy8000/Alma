import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled, getPatientIdsWithInvoice } from "@/lib/realMode";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // "active", "inactive", or null for all

    // Check if real mode is enabled
    const realModeActive = await isRealModeEnabled(session.user.organizationId);
    let allowedPatientIds: string[] | null = null;

    if (realModeActive) {
      allowedPatientIds = await getPatientIdsWithInvoice(session.user.organizationId);
    }

    const where = {
      organizationId: session.user.organizationId,
      deletedAt: null, // Exclude soft deleted
      ...(realModeActive && allowedPatientIds && { id: { in: allowedPatientIds } }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { patientCode: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status === "active" && { isActive: true }),
      ...(status === "inactive" && { isActive: false }),
    };

    const patients = await prisma.patient.findMany({
      where,
      include: {
        _count: {
          select: { appointments: true },
        },
        appointments: {
          include: {
            sales: {
              where: realModeActive ? { hasElectronicInvoice: true } : undefined,
            },
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const patientsWithStats = patients.map((patient) => {
      const totalSpent = patient.appointments.reduce((sum, apt) => {
        return sum + apt.sales.reduce((s, sale) => s + Number(sale.amount), 0);
      }, 0);

      return {
        id: patient.id,
        patientCode: patient.patientCode,
        fullName: patient.fullName,
        phone: patient.phone,
        whatsapp: patient.whatsapp,
        email: patient.email,
        notes: patient.notes,
        isActive: patient.isActive,
        firstAppointmentDate: patient.firstAppointmentDate,
        createdAt: patient.createdAt,
        totalAppointments: patient._count.appointments,
        totalSpent,
      };
    });

    return NextResponse.json(patientsWithStats);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Error al obtener pacientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, whatsapp, email, notes } = body;

    if (!fullName) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Check for duplicate phone/whatsapp
    const normalizedPhone = phone?.replace(/\D/g, "") || "";
    const normalizedWhatsapp = whatsapp?.replace(/\D/g, "") || "";

    if (normalizedPhone || normalizedWhatsapp) {
      const duplicateConditions = [];

      if (normalizedPhone) {
        duplicateConditions.push({ phone: { contains: normalizedPhone } });
        duplicateConditions.push({ whatsapp: { contains: normalizedPhone } });
      }

      if (normalizedWhatsapp && normalizedWhatsapp !== normalizedPhone) {
        duplicateConditions.push({ phone: { contains: normalizedWhatsapp } });
        duplicateConditions.push({ whatsapp: { contains: normalizedWhatsapp } });
      }

      const existingPatient = await prisma.patient.findFirst({
        where: {
          organizationId: session.user.organizationId,
          deletedAt: null,
          isActive: true,
          OR: duplicateConditions,
        },
      });

      if (existingPatient) {
        return NextResponse.json(
          {
            error: `Ya existe un paciente con este número: ${existingPatient.fullName} (${existingPatient.patientCode})`,
            duplicatePatient: {
              id: existingPatient.id,
              fullName: existingPatient.fullName,
              patientCode: existingPatient.patientCode,
            }
          },
          { status: 400 }
        );
      }
    }

    // Generate patient code
    const lastPatient = await prisma.patient.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { patientCode: "desc" },
    });

    let nextNumber = 1;
    if (lastPatient?.patientCode) {
      const match = lastPatient.patientCode.match(/MDA-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const patientCode = `MDA-${nextNumber.toString().padStart(4, "0")}`;

    const patient = await prisma.patient.create({
      data: {
        organizationId: session.user.organizationId,
        patientCode,
        fullName,
        phone,
        whatsapp,
        email,
        notes,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Error al crear paciente" },
      { status: 500 }
    );
  }
}
