import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAppointmentSchema = z.object({
  patientId: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  type: z.enum(["presencial", "virtual", "terapia_choque"]).optional(),
  location: z.string().optional().nullable(),
  status: z.enum(["confirmada", "no_responde", "cancelada", "reagendada", "completada"]).optional(),
  notes: z.string().optional().nullable(),
  // For rescheduling
  newDate: z.string().optional(),
  newStartTime: z.string().optional(),
  newEndTime: z.string().optional(),
});

// GET /api/appointments/[id] - Get appointment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientCode: true,
            phone: true,
            whatsapp: true,
            email: true,
          },
        },
        sales: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            date: true,
          },
        },
        rescheduledTo: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
        rescheduledFrom: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Error al obtener cita" },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate with Zod
    const validation = updateAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get existing appointment
    const existing = await prisma.appointment.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        sales: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Handle rescheduling - create new appointment and link
    if (data.status === "reagendada" && data.newDate && data.newStartTime && data.newEndTime) {
      // Check for conflicts on new date/time
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          organizationId: session.user.organizationId,
          date: new Date(data.newDate),
          status: {
            notIn: ["cancelada", "reagendada"],
          },
          OR: [
            {
              AND: [
                { startTime: { lte: new Date(`1970-01-01T${data.newStartTime}`) } },
                { endTime: { gt: new Date(`1970-01-01T${data.newStartTime}`) } },
              ],
            },
            {
              AND: [
                { startTime: { lt: new Date(`1970-01-01T${data.newEndTime}`) } },
                { endTime: { gte: new Date(`1970-01-01T${data.newEndTime}`) } },
              ],
            },
            {
              AND: [
                { startTime: { gte: new Date(`1970-01-01T${data.newStartTime}`) } },
                { endTime: { lte: new Date(`1970-01-01T${data.newEndTime}`) } },
              ],
            },
          ],
        },
        include: {
          patient: { select: { fullName: true } },
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

      // Create new appointment
      const newAppointment = await prisma.appointment.create({
        data: {
          organizationId: session.user.organizationId,
          patientId: existing.patientId,
          date: new Date(data.newDate),
          startTime: new Date(`1970-01-01T${data.newStartTime}`),
          endTime: new Date(`1970-01-01T${data.newEndTime}`),
          type: existing.type,
          location: existing.location,
          status: "confirmada",
          notes: existing.notes,
        },
      });

      // Update original appointment
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: "reagendada",
          rescheduledToId: newAppointment.id,
          notes: data.notes || existing.notes,
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              patientCode: true,
            },
          },
          rescheduledTo: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      });

      return NextResponse.json(updatedAppointment);
    }

    // Regular update (not rescheduling)
    // Check for time conflicts if date/time is changing
    if (data.date || data.startTime || data.endTime) {
      const newDate = data.date ? new Date(data.date) : existing.date;
      const newStartTime = data.startTime
        ? new Date(`1970-01-01T${data.startTime}`)
        : existing.startTime;
      const newEndTime = data.endTime
        ? new Date(`1970-01-01T${data.endTime}`)
        : existing.endTime;

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          organizationId: session.user.organizationId,
          id: { not: id },
          date: newDate,
          status: {
            notIn: ["cancelada", "reagendada"],
          },
          OR: [
            {
              AND: [
                { startTime: { lte: newStartTime } },
                { endTime: { gt: newStartTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: newEndTime } },
                { endTime: { gte: newEndTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: newStartTime } },
                { endTime: { lte: newEndTime } },
              ],
            },
          ],
        },
        include: {
          patient: { select: { fullName: true } },
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
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.patientId) updateData.patientId = data.patientId;
    if (data.date) updateData.date = new Date(data.date);
    if (data.startTime) updateData.startTime = new Date(`1970-01-01T${data.startTime}`);
    if (data.endTime) updateData.endTime = new Date(`1970-01-01T${data.endTime}`);
    if (data.type) updateData.type = data.type;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Error al actualizar cita" },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Get existing appointment
    const existing = await prisma.appointment.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        sales: true,
        rescheduledFrom: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Check if appointment has sales
    if (existing.sales.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una cita con ventas asociadas. Cancélala en su lugar." },
        { status: 400 }
      );
    }

    // Check if this is a rescheduled appointment (has parent)
    if (existing.rescheduledFrom) {
      // Clear the reference in the parent appointment
      await prisma.appointment.update({
        where: { id: existing.rescheduledFrom.id },
        data: {
          rescheduledToId: null,
          status: "confirmada", // Restore original status
        },
      });
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Error al eliminar cita" },
      { status: 500 }
    );
  }
}
