import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled, getPatientIdsWithInvoice } from "@/lib/realMode";
import { z } from "zod";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "El paciente es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
  type: z.enum(["presencial", "virtual", "terapia_choque"]).default("presencial"),
  location: z.string().optional().nullable(),
  status: z.enum(["confirmada", "no_responde", "cancelada", "reagendada", "completada"]).default("confirmada"),
  notes: z.string().optional().nullable(),
});

// GET /api/appointments - List appointments with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const patientId = searchParams.get("patientId");
    const search = searchParams.get("search");

    // Check if real mode is enabled
    const realModeActive = await isRealModeEnabled(session.user.organizationId);
    let allowedPatientIds: string[] | null = null;

    if (realModeActive) {
      allowedPatientIds = await getPatientIdsWithInvoice(session.user.organizationId);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
      ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
    };

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    // Status filter
    if (status && status !== "all") {
      where.status = status;
    }

    // Type filter
    if (type && type !== "all") {
      where.type = type;
    }

    // Patient filter
    if (patientId) {
      where.patientId = patientId;
    }

    // Search by patient name
    if (search) {
      where.patient = {
        fullName: {
          contains: search,
          mode: "insensitive",
        },
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientCode: true,
            phone: true,
            whatsapp: true,
          },
        },
        sales: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Error al obtener citas" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validate with Zod
    const validation = appointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify patient belongs to organization
    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        organizationId: session.user.organizationId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Check for time conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        organizationId: session.user.organizationId,
        date: new Date(data.date),
        status: {
          notIn: ["cancelada", "reagendada"],
        },
        OR: [
          {
            // New appointment starts during existing appointment
            AND: [
              { startTime: { lte: new Date(`1970-01-01T${data.startTime}`) } },
              { endTime: { gt: new Date(`1970-01-01T${data.startTime}`) } },
            ],
          },
          {
            // New appointment ends during existing appointment
            AND: [
              { startTime: { lt: new Date(`1970-01-01T${data.endTime}`) } },
              { endTime: { gte: new Date(`1970-01-01T${data.endTime}`) } },
            ],
          },
          {
            // New appointment contains existing appointment
            AND: [
              { startTime: { gte: new Date(`1970-01-01T${data.startTime}`) } },
              { endTime: { lte: new Date(`1970-01-01T${data.endTime}`) } },
            ],
          },
        ],
      },
      include: {
        patient: {
          select: { fullName: true },
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        {
          error: `Ya existe una cita en ese horario con ${conflictingAppointment.patient.fullName}`,
        },
        { status: 400 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        organizationId: session.user.organizationId,
        patientId: data.patientId,
        date: new Date(data.date),
        startTime: new Date(`1970-01-01T${data.startTime}`),
        endTime: new Date(`1970-01-01T${data.endTime}`),
        type: data.type,
        location: data.location || null,
        status: data.status,
        notes: data.notes || null,
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientCode: true,
          },
        },
      },
    });

    // Update patient's firstAppointmentDate if this is their first appointment
    if (!patient.firstAppointmentDate) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: { firstAppointmentDate: new Date(data.date) },
      });
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Error al crear cita" },
      { status: 500 }
    );
  }
}
