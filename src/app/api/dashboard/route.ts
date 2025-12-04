import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled, getPatientIdsWithInvoice } from "@/lib/realMode";
import { startOfDay, endOfDay, subDays, startOfMonth, format } from "date-fns";
import { getColombiaToday, getColombiaTomorrow } from "@/lib/dates";

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const atRiskDays = parseInt(searchParams.get("atRiskDays") || "30", 10);

    const organizationId = session.user.organizationId;

    // Check if real mode is enabled
    const realModeActive = await isRealModeEnabled(organizationId);
    let allowedPatientIds: string[] | null = null;

    if (realModeActive) {
      allowedPatientIds = await getPatientIdsWithInvoice(organizationId);
    }

    // Use Colombia timezone for consistent date calculations
    const today = getColombiaToday();
    const monthStart = startOfMonth(today);
    const ninetyDaysAgo = subDays(today, 90);
    const atRiskCutoff = subDays(today, atRiskDays);

    // 1. PACIENTES ACTIVOS - Pacientes con al menos 1 cita en últimos 90 días
    const activePatients = await prisma.patient.count({
      where: {
        organizationId,
        deletedAt: null,
        ...(realModeActive && allowedPatientIds && { id: { in: allowedPatientIds } }),
        appointments: {
          some: {
            deletedAt: null,
            date: {
              gte: ninetyDaysAgo,
              lte: today,
            },
            status: {
              notIn: ["cancelada", "reagendada"],
            },
          },
        },
      },
    });

    // 2. NUEVOS ESTE MES - Pacientes cuya PRIMERA cita fue en el mes actual
    const newPatientsThisMonth = await prisma.patient.count({
      where: {
        organizationId,
        deletedAt: null,
        ...(realModeActive && allowedPatientIds && { id: { in: allowedPatientIds } }),
        firstAppointmentDate: {
          gte: monthStart,
          lte: today,
        },
      },
    });

    // 3. RECURRENTES ESTE MES - Pacientes con 2+ citas en el mes actual
    const patientsWithAppointmentsThisMonth = await prisma.patient.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(realModeActive && allowedPatientIds && { id: { in: allowedPatientIds } }),
        appointments: {
          some: {
            deletedAt: null,
            date: {
              gte: monthStart,
              lte: today,
            },
            status: {
              notIn: ["cancelada", "reagendada"],
            },
          },
        },
      },
      select: {
        id: true,
        _count: {
          select: {
            appointments: {
              where: {
                deletedAt: null,
                date: {
                  gte: monthStart,
                  lte: today,
                },
                status: {
                  notIn: ["cancelada", "reagendada"],
                },
              },
            },
          },
        },
      },
    });
    const recurrentPatientsThisMonth = patientsWithAppointmentsThisMonth.filter(
      (p) => p._count.appointments >= 2
    ).length;

    // 4. EN RIESGO - Pacientes que han tenido citas antes pero llevan X días sin venir
    // Get all patients who have had at least one appointment ever
    const patientsWithHistory = await prisma.patient.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(realModeActive && allowedPatientIds && { id: { in: allowedPatientIds } }),
        appointments: {
          some: {
            deletedAt: null,
            status: {
              notIn: ["cancelada", "reagendada"],
            },
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        appointments: {
          where: {
            deletedAt: null,
            status: {
              notIn: ["cancelada", "reagendada"],
            },
          },
          orderBy: { date: "desc" },
          take: 1,
          select: {
            date: true,
          },
        },
      },
    });

    // Filter patients whose last appointment is older than atRiskCutoff
    const atRiskPatientsList = patientsWithHistory
      .filter((p) => {
        if (p.appointments.length === 0) return false;
        const lastAppointmentDate = new Date(p.appointments[0].date);
        return lastAppointmentDate < atRiskCutoff;
      })
      .map((p) => {
        const lastDate = new Date(p.appointments[0].date);
        const daysSinceLastVisit = Math.floor(
          (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          id: p.id,
          fullName: p.fullName,
          phone: p.phone,
          lastAppointmentDate: lastDate.toISOString(),
          daysSinceLastVisit,
        };
      })
      .sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

    const atRiskPatientsCount = atRiskPatientsList.length;

    // Get tomorrow's appointments ONLY (using Colombia timezone)
    const tomorrow = getColombiaTomorrow();
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEndDay = endOfDay(tomorrow);

    // Get ALL tomorrow's appointments (excluding deleted and reagendada)
    const tomorrowAppointmentsRaw = await prisma.appointment.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
        date: {
          gte: tomorrowStart,
          lte: tomorrowEndDay,
        },
        status: {
          notIn: ["reagendada"],
        },
      },
      include: {
        patient: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: [
        { startTime: "asc" },
      ],
    });

    // Calculate stats for banner
    const totalTomorrow = tomorrowAppointmentsRaw.filter(a => a.status !== "cancelada").length;
    const confirmedCount = tomorrowAppointmentsRaw.filter(a => a.status === "confirmada").length;
    const pendingCount = tomorrowAppointmentsRaw.filter(a => a.status === "no_responde").length;
    const cancelledCount = tomorrowAppointmentsRaw.filter(a => a.status === "cancelada").length;

    // Only return non-confirmed appointments in the list (those needing action)
    const tomorrowAppointments = tomorrowAppointmentsRaw
      .filter(apt => apt.status !== "confirmada" && apt.status !== "cancelada")
      .map((apt) => {
        const timeStr = apt.startTime.toISOString().split("T")[1].substring(0, 5);
        return {
          id: apt.id,
          time: timeStr,
          patient: apt.patient.fullName,
          type: apt.type,
          status: apt.status,
        };
      });

    // Format tomorrow's date for display
    const tomorrowDateFormatted = tomorrow.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    // Capitalize first letter
    const tomorrowDateDisplay = tomorrowDateFormatted.charAt(0).toUpperCase() + tomorrowDateFormatted.slice(1);

    // Date for link (YYYY-MM-DD)
    const tomorrowDateLink = format(tomorrow, "yyyy-MM-dd");

    return NextResponse.json({
      // Scorecards data
      activePatients,
      newPatientsThisMonth,
      recurrentPatientsThisMonth,
      atRiskPatientsCount,
      atRiskPatientsList,
      atRiskDays,
      // Tomorrow appointments data
      tomorrowAppointments,
      tomorrowStats: {
        total: totalTomorrow,
        confirmed: confirmedCount,
        pending: pendingCount,
        cancelled: cancelledCount,
      },
      tomorrowDateDisplay,
      tomorrowDateLink,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}
