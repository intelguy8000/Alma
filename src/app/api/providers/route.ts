import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const simple = searchParams.get("simple") === "true";

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Simple mode for dropdowns (just id and name)
    if (simple) {
      const providers = await prisma.provider.findMany({
        where,
        select: {
          id: true,
          name: true,
          contactName: true,
          phone: true,
          email: true,
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(providers);
    }

    // Full mode with expense totals
    const providers = await prisma.provider.findMany({
      where,
      include: {
        _count: {
          select: { expenses: true },
        },
        expenses: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate total expenses for each provider
    const providersWithTotals = providers.map((provider) => {
      const totalExpenses = provider.expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expenses, ...providerWithoutExpenses } = provider;
      return {
        ...providerWithoutExpenses,
        totalExpenses,
      };
    });

    return NextResponse.json(providersWithTotals);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Error al obtener proveedores" },
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
    const { name, contactName, phone, email, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.create({
      data: {
        organizationId: session.user.organizationId,
        name: name.trim(),
        contactName: contactName?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json(
      { error: "Error al crear proveedor" },
      { status: 500 }
    );
  }
}
