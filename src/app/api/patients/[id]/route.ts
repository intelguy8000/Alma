import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, serializeForAudit } from "@/lib/audit";

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

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      include: {
        appointments: {
          include: {
            sales: true,
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const totalSpent = patient.appointments.reduce((sum, apt) => {
      return sum + apt.sales.reduce((s, sale) => s + Number(sale.amount), 0);
    }, 0);

    return NextResponse.json({
      ...patient,
      totalSpent,
      totalAppointments: patient.appointments.length,
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Error al obtener paciente" },
      { status: 500 }
    );
  }
}

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
    const { fullName, phone, whatsapp, email, notes, isActive } = body;

    // Verify patient belongs to organization
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Check for duplicate phone/whatsapp (excluding current patient)
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

      const duplicatePatient = await prisma.patient.findFirst({
        where: {
          organizationId: session.user.organizationId,
          deletedAt: null,
          isActive: true,
          id: { not: id }, // Exclude current patient
          OR: duplicateConditions,
        },
      });

      if (duplicatePatient) {
        return NextResponse.json(
          {
            error: `Ya existe un paciente con este número: ${duplicatePatient.fullName} (${duplicatePatient.patientCode})`,
            duplicatePatient: {
              id: duplicatePatient.id,
              fullName: duplicatePatient.fullName,
              patientCode: duplicatePatient.patientCode,
            }
          },
          { status: 400 }
        );
      }
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(email !== undefined && { email }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Error al actualizar paciente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verify patient belongs to organization and is not already deleted
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Check for associated sales (through appointments)
    const salesCount = await prisma.sale.count({
      where: {
        organizationId: session.user.organizationId,
        patientId: id,
        deletedAt: null,
      },
    });

    const appointmentsCount = existingPatient._count.appointments;

    // If patient has appointments or sales, prevent deletion
    if (appointmentsCount > 0 || salesCount > 0) {
      const parts = [];
      if (appointmentsCount > 0) {
        parts.push(`${appointmentsCount} cita${appointmentsCount > 1 ? "s" : ""}`);
      }
      if (salesCount > 0) {
        parts.push(`${salesCount} pago${salesCount > 1 ? "s" : ""}`);
      }

      return NextResponse.json(
        {
          error: `No se puede eliminar. Este paciente tiene ${parts.join(" y ")} registrado${appointmentsCount + salesCount > 1 ? "s" : ""}.`,
          canDelete: false,
          appointmentsCount,
          salesCount,
        },
        { status: 400 }
      );
    }

    // Soft delete - set deletedAt and deletedById
    await prisma.patient.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
        isActive: false,
      },
    });

    // Log audit
    await logAudit({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: "DELETE",
      entity: "Patient",
      entityId: id,
      oldData: serializeForAudit(existingPatient),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Error al eliminar paciente" },
      { status: 500 }
    );
  }
}
