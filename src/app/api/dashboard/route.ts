import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled, getPatientIdsWithInvoice } from "@/lib/realMode";
import { startOfDay, endOfDay, subDays, startOfMonth, startOfWeek, addDays, format } from "date-fns";
import { getColombiaToday } from "@/lib/dates";

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

    // Get appointments data for chart (by week) - last 30 days
    const thirtyDaysAgo = subDays(today, 30);
    const appointments = await prisma.appointment.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
        date: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      include: {
        patient: {
          select: {
            firstAppointmentDate: true,
          },
        },
      },
    });

    // Group appointments by week
    const appointmentsByWeek: Record<string, {
      presenciales: number;
      virtuales: number;
      nuevos: number;
      antiguos: number;
      terapiaChoque: number;
    }> = {};

    appointments.forEach((apt) => {
      const weekStart = startOfWeek(new Date(apt.date), { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (!appointmentsByWeek[weekKey]) {
        appointmentsByWeek[weekKey] = {
          presenciales: 0,
          virtuales: 0,
          nuevos: 0,
          antiguos: 0,
          terapiaChoque: 0,
        };
      }

      if (apt.type === "presencial") {
        appointmentsByWeek[weekKey].presenciales++;
      } else if (apt.type === "virtual") {
        appointmentsByWeek[weekKey].virtuales++;
      } else if (apt.type === "terapia_choque") {
        appointmentsByWeek[weekKey].terapiaChoque++;
      }

      // Check if this is the patient's first appointment
      const isNew = apt.patient.firstAppointmentDate &&
        new Date(apt.patient.firstAppointmentDate).getTime() === new Date(apt.date).getTime();

      if (isNew) {
        appointmentsByWeek[weekKey].nuevos++;
      } else {
        appointmentsByWeek[weekKey].antiguos++;
      }
    });

    // Convert to array for chart
    const appointmentsData = Object.entries(appointmentsByWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekKey, data], index) => ({
        name: `Sem ${index + 1}`,
        ...data,
      }));

    // Get patients data for line chart (by day of week)
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    const patientsData = await Promise.all(
      dayLabels.map(async (day, index) => {
        const dayDate = addDays(currentWeekStart, index);
        const dayStart = startOfDay(dayDate);
        const dayEnd = endOfDay(dayDate);
        const isFuture = dayDate > today;

        // Count patients attended = patients with sales on this day
        const attended = await prisma.sale.count({
          where: {
            organizationId,
            deletedAt: null,
            ...(realModeActive && { hasElectronicInvoice: true }),
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        });

        const cancelled = await prisma.appointment.count({
          where: {
            organizationId,
            deletedAt: null,
            ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
            status: "cancelada",
          },
        });

        const scheduled = await prisma.appointment.count({
          where: {
            organizationId,
            deletedAt: null,
            ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
            status: {
              in: ["confirmada", "no_responde"],
            },
          },
        });

        return {
          day,
          atendidos: attended,
          cancelados: cancelled,
          proyeccion: isFuture ? scheduled : undefined,
        };
      })
    );

    // Get upcoming appointments for today and tomorrow
    const tomorrowEnd = endOfDay(addDays(today, 1));
    const upcomingAppointmentsRaw = await prisma.appointment.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
        date: {
          gte: startOfDay(today),
          lte: tomorrowEnd,
        },
        status: {
          in: ["confirmada", "no_responde", "reagendada"],
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
        { date: "asc" },
        { startTime: "asc" },
      ],
      take: 10,
    });

    const upcomingAppointments = upcomingAppointmentsRaw.map((apt) => {
      const timeStr = apt.startTime.toISOString().split("T")[1].substring(0, 5);
      return {
        id: apt.id,
        time: timeStr,
        patient: apt.patient.fullName,
        type: apt.type,
        status: apt.status,
      };
    });

    return NextResponse.json({
      // Scorecards data
      activePatients,
      newPatientsThisMonth,
      recurrentPatientsThisMonth,
      atRiskPatientsCount,
      atRiskPatientsList,
      atRiskDays,
      // Charts data
      appointmentsData,
      patientsData,
      upcomingAppointments,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}
