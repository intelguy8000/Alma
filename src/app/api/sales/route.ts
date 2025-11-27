import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled } from "@/lib/realMode";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentMethod = searchParams.get("paymentMethod");
    const patientId = searchParams.get("patientId");
    const hasElectronicInvoice = searchParams.get("hasElectronicInvoice");

    // Check if real mode is enabled
    const realModeActive = await isRealModeEnabled(session.user.organizationId);

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
      deletedAt: null, // Exclude soft deleted
    };

    // If real mode is active, only show sales with electronic invoice
    if (realModeActive) {
      where.hasElectronicInvoice = true;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = { gte: new Date(startDate) };
    } else if (endDate) {
      where.date = { lte: new Date(endDate) };
    }

    if (paymentMethod && paymentMethod !== "all") {
      where.paymentMethod = paymentMethod;
    }

    // Only apply manual filter if real mode is not active
    if (!realModeActive && hasElectronicInvoice && hasElectronicInvoice !== "all") {
      where.hasElectronicInvoice = hasElectronicInvoice === "true";
    }

    if (patientId) {
      where.patientId = patientId;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientCode: true,
          },
        },
        appointment: true,
        bankAccount: {
          select: {
            id: true,
            alias: true,
            bankName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, appointmentId, amount, paymentMethod, paymentNote, bankAccountId, hasElectronicInvoice, date } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: "El paciente es requerido" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "El monto es requerido y debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "El método de pago es requerido" },
        { status: 400 }
      );
    }

    // Verify patient belongs to organization
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

    // Verify appointment belongs to organization if provided
    if (appointmentId) {
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

    // Verify bank account if provided
    if (bankAccountId) {
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

    const sale = await prisma.sale.create({
      data: {
        organizationId: session.user.organizationId,
        patientId,
        appointmentId: appointmentId || null,
        amount,
        paymentMethod,
        paymentNote: paymentNote || null,
        bankAccountId: bankAccountId || null,
        hasElectronicInvoice: hasElectronicInvoice || false,
        date: date ? new Date(date) : new Date(),
        createdById: session.user.id,
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

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Error al crear venta" },
      { status: 500 }
    );
  }
}
