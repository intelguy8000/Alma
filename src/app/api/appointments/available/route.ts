import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get appointments that can have a sale registered (completed without existing sale)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
      status: { in: ["completada", "confirmada"] },
      sales: {
        none: {},
      },
    };

    if (patientId) {
      where.patientId = patientId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientCode: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching available appointments:", error);
    return NextResponse.json(
      { error: "Error al obtener citas disponibles" },
      { status: 500 }
    );
  }
}
