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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const providerId = searchParams.get("providerId");

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
      deletedAt: null, // Exclude soft deleted
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (category) {
      where.category = category;
    }

    if (providerId) {
      where.providerId = providerId;
    }

    const expenses = await prisma.expense.findMany({
      where,
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
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Error al obtener gastos" },
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
    const { description, amount, category, date, providerId } = body;

    if (!description || !amount) {
      return NextResponse.json(
        { error: "Descripción y monto son requeridos" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        organizationId: session.user.organizationId,
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
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Error al crear gasto" },
      { status: 500 }
    );
  }
}
