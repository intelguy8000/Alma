import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        appointment: {
          include: {
            patient: true,
          },
        },
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
    const { appointmentId, amount, paymentMethod, paymentNote, bankAccountId, hasElectronicInvoice, date } = body;

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
        ...(appointmentId !== undefined && { appointmentId: appointmentId || null }),
        ...(amount !== undefined && { amount }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(paymentNote !== undefined && { paymentNote: paymentNote || null }),
        ...(bankAccountId !== undefined && { bankAccountId: bankAccountId || null }),
        ...(hasElectronicInvoice !== undefined && { hasElectronicInvoice }),
        ...(date !== undefined && { date: new Date(date) }),
      },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
                patientCode: true,
              },
            },
          },
        },
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
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

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

    await prisma.sale.delete({
      where: { id },
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
