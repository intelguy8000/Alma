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

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Error al obtener gasto" },
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
    const { description, amount, category, date, providerId } = body;

    // Verify expense belongs to organization
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      );
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description,
        amount,
        category: category || null,
        date: new Date(date),
        providerId: providerId || null,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Error al actualizar gasto" },
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

    // Verify expense belongs to organization and is not already deleted
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      include: {
        provider: { select: { name: true } },
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.expense.update({
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
      entity: "Expense",
      entityId: id,
      oldData: serializeForAudit(existingExpense),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Error al eliminar gasto" },
      { status: 500 }
    );
  }
}
