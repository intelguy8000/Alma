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
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
      isActive: true,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (category) {
      where.category = category;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        _count: {
          select: { movements: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Filter by status if provided
    let filteredItems = items;
    if (status && status !== "all") {
      filteredItems = items.filter((item) => {
        const currentStock = Number(item.currentStock);
        const minStock = Number(item.minStock);

        if (status === "critico") {
          return currentStock <= 0;
        } else if (status === "bajo") {
          return currentStock > 0 && currentStock <= minStock;
        } else if (status === "normal") {
          return currentStock > minStock;
        }
        return true;
      });
    }

    return NextResponse.json(filteredItems);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Error al obtener inventario" },
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
    const { name, currentStock, minStock, unit, category } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Create item and initial movement in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          organizationId: session.user.organizationId!,
          name: name.trim(),
          currentStock: currentStock || 0,
          minStock: minStock || 0,
          unit: unit || null,
          category: category || null,
        },
      });

      // Create initial stock movement if currentStock > 0
      if (currentStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: item.id,
            type: "entrada",
            quantity: currentStock,
            reason: "Stock inicial",
            createdById: session.user.id!,
          },
        });
      }

      return item;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Error al crear item" },
      { status: 500 }
    );
  }
}
