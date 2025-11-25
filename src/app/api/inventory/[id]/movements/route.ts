import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, quantity, reason } = body;

    if (!type || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Tipo y cantidad son requeridos" },
        { status: 400 }
      );
    }

    if (type !== "entrada" && type !== "salida") {
      return NextResponse.json(
        { error: "Tipo de movimiento inválido" },
        { status: 400 }
      );
    }

    // Verify item belongs to organization
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    // Calculate new stock
    const currentStock = Number(item.currentStock);
    const adjustmentQty = Number(quantity);
    const newStock = type === "entrada"
      ? currentStock + adjustmentQty
      : currentStock - adjustmentQty;

    // Create movement and update stock in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create movement
      const movement = await tx.inventoryMovement.create({
        data: {
          inventoryItemId: id,
          type,
          quantity: adjustmentQty,
          reason: reason?.trim() || null,
          createdById: session.user.id!,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // Update item stock
      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock },
      });

      return { movement, item: updatedItem };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating movement:", error);
    return NextResponse.json(
      { error: "Error al registrar movimiento" },
      { status: 500 }
    );
  }
}

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

    // Verify item belongs to organization
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    const movements = await prisma.inventoryMovement.findMany({
      where: { inventoryItemId: id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching movements:", error);
    return NextResponse.json(
      { error: "Error al obtener movimientos" },
      { status: 500 }
    );
  }
}
