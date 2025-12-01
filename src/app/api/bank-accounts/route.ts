import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bank-accounts - Get all bank accounts
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: {
          select: { sales: true },
        },
      },
      orderBy: { alias: "asc" },
    });

    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { error: "Error al cargar cuentas bancarias" },
      { status: 500 }
    );
  }
}

// POST /api/bank-accounts - Create new bank account
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { alias, accountNumber, bankName, accountHolder, accountHolderId, accountType } = body;

    if (!alias?.trim()) {
      return NextResponse.json(
        { error: "El alias es requerido" },
        { status: 400 }
      );
    }

    const bankAccount = await prisma.bankAccount.create({
      data: {
        organizationId: session.user.organizationId,
        alias: alias.trim(),
        accountNumber: accountNumber?.trim() || null,
        bankName: bankName?.trim() || null,
        accountHolder: accountHolder?.trim() || null,
        accountHolderId: accountHolderId?.trim() || null,
        accountType: accountType?.trim() || null,
      },
    });

    return NextResponse.json(bankAccount, { status: 201 });
  } catch (error) {
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { error: "Error al crear cuenta bancaria" },
      { status: 500 }
    );
  }
}
