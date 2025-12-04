import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled, getPatientIdsWithInvoice } from "@/lib/realMode";
import { startOfWeek, subWeeks, format } from "date-fns";
import { es } from "date-fns/locale";
import { getColombiaToday } from "@/lib/dates";

// GET /api/dashboard/appointments-distribution - Get appointments distribution data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check if real mode is enabled
    const realModeActive = await isRealModeEnabled(organizationId);
    let allowedPatientIds: string[] | null = null;

    if (realModeActive) {
      allowedPatientIds = await getPatientIdsWithInvoice(organizationId);
    }

    // Get ALL appointments (cumulative, no date filter) for donut
    const allAppointments = await prisma.appointment.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
        status: {
          notIn: ["cancelada", "reagendada"],
        },
      },
      select: {
        type: true,
        date: true,
      },
    });

    // Calculate distribution by modality (presencial vs virtual)
    // Note: terapia_choque is counted as presencial for modality purposes
    const presencialCount = allAppointments.filter(
      (a) => a.type === "presencial" || a.type === "terapia_choque"
    ).length;
    const virtualCount = allAppointments.filter((a) => a.type === "virtual").length;
    const totalModality = presencialCount + virtualCount;

    // Calculate distribution by type (normal vs terapia_choque)
    const normalCount = allAppointments.filter(
      (a) => a.type === "presencial" || a.type === "virtual"
    ).length;
    const terapiaChoqueCount = allAppointments.filter(
      (a) => a.type === "terapia_choque"
    ).length;
    const totalType = normalCount + terapiaChoqueCount;

    // Calculate weekly trend data (last 8 weeks)
    const today = getColombiaToday();
    const weeksCount = 8;
    const weeklyTrend: Array<{
      week: string;
      weekLabel: string;
      presencial: number;
      virtual: number;
      normal: number;
      terapiaChoque: number;
    }> = [];

    for (let i = weeksCount - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-MM-dd");
      const weekLabel = format(weekStart, "d MMM", { locale: es });

      // Filter appointments for this week
      const weekAppointments = allAppointments.filter((a) => {
        const aptWeekStart = startOfWeek(new Date(a.date), { weekStartsOn: 1 });
        return format(aptWeekStart, "yyyy-MM-dd") === weekKey;
      });

      weeklyTrend.push({
        week: weekKey,
        weekLabel,
        presencial: weekAppointments.filter(
          (a) => a.type === "presencial" || a.type === "terapia_choque"
        ).length,
        virtual: weekAppointments.filter((a) => a.type === "virtual").length,
        normal: weekAppointments.filter(
          (a) => a.type === "presencial" || a.type === "virtual"
        ).length,
        terapiaChoque: weekAppointments.filter(
          (a) => a.type === "terapia_choque"
        ).length,
      });
    }

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
      weeklyTrend,
    });
  } catch (error) {
    console.error("Error fetching appointments distribution:", error);
    return NextResponse.json(
      { error: "Error al obtener distribución de citas" },
      { status: 500 }
    );
  }
}
