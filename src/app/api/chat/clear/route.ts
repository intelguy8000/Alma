import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/chat/clear - Clear chat history for current user
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.chatMessage.deleteMany({
      where: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return NextResponse.json(
      { error: "Error al limpiar historial" },
      { status: 500 }
    );
  }
}
