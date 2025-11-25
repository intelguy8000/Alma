import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/feedback/export - Export feedback as CSV (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Only admins can export feedback
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const feedback = await prisma.tabataFeedback.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = ["Fecha", "Usuario", "Email", "Tipo", "Descripción", "Contexto", "Estado"];
    const rows = feedback.map((f) => [
      f.createdAt.toLocaleDateString("es-CO"),
      f.user.fullName,
      f.user.email,
      f.type,
      `"${f.description.replace(/"/g, '""')}"`, // Escape quotes
      f.context ? `"${f.context.replace(/"/g, '""')}"` : "",
      f.status,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="feedback-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting feedback:", error);
    return NextResponse.json(
      { error: "Error al exportar feedback" },
      { status: 500 }
    );
  }
}
