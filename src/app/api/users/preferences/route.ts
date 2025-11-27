import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET current user preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferredColor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      preferredColor: user.preferredColor || "#6B9080",
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Error al obtener preferencias" },
      { status: 500 }
    );
  }
}

// PUT update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { preferredColor } = body;

    // Validate color format (hex color)
    if (preferredColor && !/^#[0-9A-Fa-f]{6}$/.test(preferredColor)) {
      return NextResponse.json(
        { error: "Formato de color inválido" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferredColor: preferredColor || "#6B9080",
      },
      select: {
        preferredColor: true,
      },
    });

    return NextResponse.json({
      preferredColor: updatedUser.preferredColor,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Error al actualizar preferencias" },
      { status: 500 }
    );
  }
}
