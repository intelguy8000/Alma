import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled, getPatientIdsWithInvoice } from "@/lib/realMode";
import { startOfDay, endOfDay, subDays, startOfYear, subMonths, format, startOfWeek, addDays } from "date-fns";
import { getColombiaToday } from "@/lib/dates";

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const organizationId = session.user.organizationId;
    const now = new Date();

    // Check if real mode is enabled
    const realModeActive = await isRealModeEnabled(organizationId);
    let allowedPatientIds: string[] | null = null;

    if (realModeActive) {
      allowedPatientIds = await getPatientIdsWithInvoice(organizationId);
    }

    // Calculate date range
    let startDate: Date;
    let endDate = endOfDay(now);
    let previousStartDate: Date;
    let previousEndDate: Date;

    if (startDateParam && endDateParam) {
      startDate = startOfDay(new Date(startDateParam));
      endDate = endOfDay(new Date(endDateParam));
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      previousEndDate = subDays(startDate, 1);
      previousStartDate = subDays(previousEndDate, daysDiff);
    } else {
      switch (range) {
        case "7d":
          startDate = startOfDay(subDays(now, 7));
          previousStartDate = startOfDay(subDays(now, 14));
          previousEndDate = endOfDay(subDays(now, 8));
          break;
        case "90d":
          startDate = startOfDay(subMonths(now, 3));
          previousStartDate = startOfDay(subMonths(now, 6));
          previousEndDate = endOfDay(subMonths(now, 3));
          break;
        case "year":
          startDate = startOfYear(now);
          previousStartDate = startOfYear(subDays(startOfYear(now), 1));
          previousEndDate = endOfDay(subDays(startOfYear(now), 1));
          break;
        default: // 30d
          startDate = startOfDay(subDays(now, 30));
          previousStartDate = startOfDay(subDays(now, 60));
          previousEndDate = endOfDay(subDays(now, 31));
      }
    }

    // Get active patients (patients with at least one appointment in the range)
    const activePatients = await prisma.patient.count({
      where: {
        organizationId,
        ...(realModeActive && allowedPatientIds && { id: { in: allowedPatientIds } }),
        appointments: {
          some: {
            date: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              notIn: ["cancelada"],
            },
          },
        },
      },
    });

    // Previous period active patients
    const previousActivePatients = await prisma.patient.count({
      where: {
        organizationId,
        ...(realModeActive && allowedPatientIds && { id: { in: allowedPatientIds } }),
        appointments: {
          some: {
            date: {
              gte: previousStartDate,
              lte: previousEndDate,
            },
            status: {
              notIn: ["cancelada"],
            },
          },
        },
      },
    });

    // Get total sales for current period
    const sales = await prisma.sale.aggregate({
      where: {
        organizationId,
        ...(realModeActive && { hasElectronicInvoice: true }),
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const totalSales = Number(sales._sum.amount) || 0;

    // Previous period sales
    const previousSalesResult = await prisma.sale.aggregate({
      where: {
        organizationId,
        ...(realModeActive && { hasElectronicInvoice: true }),
        date: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const previousSales = Number(previousSalesResult._sum.amount) || 0;

    // Get total expenses for current period
    const expenses = await prisma.expense.aggregate({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const totalExpenses = Number(expenses._sum.amount) || 0;

    // Previous period expenses
    const previousExpensesResult = await prisma.expense.aggregate({
      where: {
        organizationId,
        date: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const previousExpenses = Number(previousExpensesResult._sum.amount) || 0;

    // Calculate profit
    const profit = totalSales - totalExpenses;
    const previousProfit = previousSales - previousExpenses;

    // Calculate percentage changes
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    const activePatientsChange = calcChange(activePatients, previousActivePatients);
    const salesChange = calcChange(totalSales, previousSales);
    const expensesChange = calcChange(totalExpenses, previousExpenses);
    const profitChange = calcChange(profit, previousProfit);

    // Get appointments data for chart (by week)
    const appointments = await prisma.appointment.findMany({
      where: {
        organizationId,
        ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
        date: {
          gte: startDate,
          lte: endDate,
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
    // Use Colombia timezone to ensure correct "today" calculation
    const today = getColombiaToday();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    const patientsData = await Promise.all(
      dayLabels.map(async (day, index) => {
        const dayDate = addDays(weekStart, index);
        const dayStart = startOfDay(dayDate);
        const dayEnd = endOfDay(dayDate);
        const isFuture = dayDate > today;

        const attended = await prisma.appointment.count({
          where: {
            organizationId,
            ...(realModeActive && allowedPatientIds && { patientId: { in: allowedPatientIds } }),
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
            status: "completada",
          },
        });

        const cancelled = await prisma.appointment.count({
          where: {
            organizationId,
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
      activePatients,
      activePatientsChange,
      totalSales,
      previousSales,
      salesChange,
      totalExpenses,
      previousExpenses,
      expensesChange,
      profit,
      profitChange,
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
