import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled, getPatientIdsWithInvoice } from "@/lib/realMode";
import { subDays, subMonths, startOfMonth } from "date-fns";
import { getColombiaToday } from "@/lib/dates";

// GET /api/dashboard/appointments-distribution - Get appointments distribution data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // week, month, quarter

    const organizationId = session.user.organizationId;

    // Check if real mode is enabled
    const realModeActive = await isRealModeEnabled(organizationId);
    let allowedPatientIds: string[] | null = null;

    if (realModeActive) {
      allowedPatientIds = await getPatientIdsWithInvoice(organizationId);
    }

    // Calculate date range based on period
    const today = getColombiaToday();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = subDays(today, 7);
        break;
      case "quarter":
        startDate = subMonths(today, 3);
        break;
      case "month":
      default:
        startDate = startOfMonth(today);
        break;
    }

    // Get all appointments in the period (excluding cancelled and deleted)
    const appointments = await prisma.appointment.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
        date: {
          gte: startDate,
          lte: today,
        },
        status: {
          notIn: ["cancelada", "reagendada"],
        },
      },
      select: {
        type: true,
      },
    });

    // Calculate distribution by modality (presencial vs virtual)
    // Note: terapia_choque is counted as presencial for modality purposes
    const presencialCount = appointments.filter(
      (a) => a.type === "presencial" || a.type === "terapia_choque"
    ).length;
    const virtualCount = appointments.filter((a) => a.type === "virtual").length;
    const totalModality = presencialCount + virtualCount;

    // Calculate distribution by type (normal vs terapia_choque)
    const normalCount = appointments.filter(
      (a) => a.type === "presencial" || a.type === "virtual"
    ).length;
    const terapiaChoqueCount = appointments.filter(
      (a) => a.type === "terapia_choque"
    ).length;
    const totalType = normalCount + terapiaChoqueCount;

    return NextResponse.json({
      byModality: {
        presencial: presencialCount,
        virtual: virtualCount,
        total: totalModality,
        presencialPercent: totalModality > 0 ? Math.round((presencialCount / totalModality) * 100) : 0,
        virtualPercent: totalModality > 0 ? Math.round((virtualCount / totalModality) * 100) : 0,
      },
      byType: {
        normal: normalCount,
        terapiaChoque: terapiaChoqueCount,
        total: totalType,
        normalPercent: totalType > 0 ? Math.round((normalCount / totalType) * 100) : 0,
        terapiaChoquePercent: totalType > 0 ? Math.round((terapiaChoqueCount / totalType) * 100) : 0,
      },
      period,
    });
  } catch (error) {
    console.error("Error fetching appointments distribution:", error);
    return NextResponse.json(
      { error: "Error al obtener distribución de citas" },
      { status: 500 }
    );
  }
}
