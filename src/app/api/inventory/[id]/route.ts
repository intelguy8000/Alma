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

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        movements: {
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Error al obtener item" },
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
    const { name, minStock, unit, category } = body;

    // Verify item belongs to organization
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: name?.trim(),
        minStock: minStock ?? existingItem.minStock,
        unit: unit || null,
        category: category || null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Error al actualizar item" },
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

    // Verify item belongs to organization
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Error al eliminar item" },
      { status: 500 }
    );
  }
}
