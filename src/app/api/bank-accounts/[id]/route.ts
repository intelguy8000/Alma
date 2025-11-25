import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/bank-accounts/[id] - Update bank account
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { alias, accountNumber, bankName, isActive } = body;

    // Verify bank account belongs to organization
    const existing = await prisma.bankAccount.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cuenta bancaria no encontrada" },
        { status: 404 }
      );
    }

    const bankAccount = await prisma.bankAccount.update({
      where: { id },
      data: {
        alias: alias?.trim() || existing.alias,
        accountNumber: accountNumber?.trim() || null,
        bankName: bankName?.trim() || null,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    return NextResponse.json(bankAccount);
  } catch (error) {
    console.error("Error updating bank account:", error);
    return NextResponse.json(
      { error: "Error al actualizar cuenta bancaria" },
      { status: 500 }
    );
  }
}

// DELETE /api/bank-accounts/[id] - Delete bank account (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verify bank account belongs to organization
    const existing = await prisma.bankAccount.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cuenta bancaria no encontrada" },
        { status: 404 }
      );
    }

    // If has sales, soft delete (deactivate)
    if (existing._count.sales > 0) {
      await prisma.bankAccount.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no sales
      await prisma.bankAccount.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return NextResponse.json(
      { error: "Error al eliminar cuenta bancaria" },
      { status: 500 }
    );
  }
}
