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

    const sale = await prisma.sale.findFirst({
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
          },
        },
        appointment: true,
        bankAccount: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Error al obtener venta" },
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
    const { patientId, appointmentId, amount, paymentMethod, paymentNote, bankAccountId, hasElectronicInvoice, date } = body;

    // Verify sale belongs to organization
    const existingSale = await prisma.sale.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Verify patient if changing
    if (patientId && patientId !== existingSale.patientId) {
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          organizationId: session.user.organizationId,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Paciente no encontrado" },
          { status: 404 }
        );
      }
    }

    // Verify appointment if changing
    if (appointmentId && appointmentId !== existingSale.appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          organizationId: session.user.organizationId,
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Cita no encontrada" },
          { status: 404 }
        );
      }
    }

    // Verify bank account if changing
    if (bankAccountId && bankAccountId !== existingSale.bankAccountId) {
      const bankAccount = await prisma.bankAccount.findFirst({
        where: {
          id: bankAccountId,
          organizationId: session.user.organizationId,
        },
      });

      if (!bankAccount) {
        return NextResponse.json(
          { error: "Cuenta bancaria no encontrada" },
          { status: 404 }
        );
      }
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        ...(patientId !== undefined && { patientId }),
        ...(appointmentId !== undefined && { appointmentId: appointmentId || null }),
        ...(amount !== undefined && { amount }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(paymentNote !== undefined && { paymentNote: paymentNote || null }),
        ...(bankAccountId !== undefined && { bankAccountId: bankAccountId || null }),
        ...(hasElectronicInvoice !== undefined && { hasElectronicInvoice }),
        ...(date !== undefined && { date: new Date(date) }),
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientCode: true,
          },
        },
        appointment: true,
        bankAccount: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Error al actualizar venta" },
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

    // Verify sale belongs to organization and is not already deleted
    const existingSale = await prisma.sale.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      include: {
        patient: { select: { fullName: true } },
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.sale.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
      },
    });

    // Log audit
    await logAudit({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: "DELETE",
      entity: "Sale",
      entityId: id,
      oldData: serializeForAudit(existingSale),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Error al eliminar venta" },
      { status: 500 }
    );
  }
}
