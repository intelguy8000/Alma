import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled } from "@/lib/realMode";
import { startOfDay, endOfDay, addDays, format, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { getColombiaToday } from "@/lib/dates";

// GET /api/dashboard/weekly-patients - Get weekly patients data for chart
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0", 10);

    const organizationId = session.user.organizationId;

    // Check if real mode is enabled
    const realModeActive = await isRealModeEnabled(organizationId);

    // Use Colombia timezone for consistent date calculations
    const today = getColombiaToday();

    // Calculate the Monday of the selected week
    // weekOffset: 0 = current week, -1 = last week, -2 = two weeks ago, etc.
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysToMonday = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
    const currentWeekMonday = addDays(today, -daysToMonday);
    const selectedWeekMonday = addDays(currentWeekMonday, weekOffset * 7);

    // Previous week for comparison (always one week before selected)
    const previousWeekMonday = subWeeks(selectedWeekMonday, 1);

    // Day labels (Monday to Friday only)
    const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie"];

    // Get data for both selected week and previous week
    const weeklyData = await Promise.all(
      dayLabels.map(async (day, index) => {
        // Selected week day
        const selectedDayDate = addDays(selectedWeekMonday, index);
        const selectedDayStart = startOfDay(selectedDayDate);
        const selectedDayEnd = endOfDay(selectedDayDate);
        const isFuture = selectedDayDate > today;

        // Previous week day (for comparison)
        const prevDayDate = addDays(previousWeekMonday, index);
        const prevDayStart = startOfDay(prevDayDate);
        const prevDayEnd = endOfDay(prevDayDate);

        // Count sales (patients attended) for selected week
        const attended = isFuture ? 0 : await prisma.sale.count({
          where: {
            organizationId,
            deletedAt: null,
            ...(realModeActive && { hasElectronicInvoice: true }),
            date: {
              gte: selectedDayStart,
              lte: selectedDayEnd,
            },
          },
        });

        // Count sales for previous week (comparison)
        const prevAttended = await prisma.sale.count({
          where: {
            organizationId,
            deletedAt: null,
            ...(realModeActive && { hasElectronicInvoice: true }),
            date: {
              gte: prevDayStart,
              lte: prevDayEnd,
            },
          },
        });

        // Count cancelled appointments for selected week
        const cancelled = isFuture ? 0 : await prisma.appointment.count({
          where: {
            organizationId,
            deletedAt: null,
            date: {
              gte: selectedDayStart,
              lte: selectedDayEnd,
            },
            status: "cancelada",
          },
        });

        // Format full date for tooltip
        const fullDate = format(selectedDayDate, "EEEE d 'de' MMMM", { locale: es });
        const capitalizedDate = fullDate.charAt(0).toUpperCase() + fullDate.slice(1);

        return {
          day,
          fullDate: capitalizedDate,
          atendidos: attended,
          semanaAnterior: prevAttended,
          cancelados: cancelled,
          isFuture,
        };
      })
    );

    // Format date range for header
    const weekStart = selectedWeekMonday;
    const weekEnd = addDays(selectedWeekMonday, 4); // Friday
    const dateRange = `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM", { locale: es })}`;

    // Check if can navigate forward (can't go beyond current week)
    const canGoNext = weekOffset < 0;

    return NextResponse.json({
      data: weeklyData,
      dateRange,
      weekOffset,
      canGoNext,
      canGoPrev: true, // Always can go back
    });
  } catch (error) {
    console.error("Error fetching weekly patients data:", error);
    return NextResponse.json(
      { error: "Error al obtener datos semanales" },
      { status: 500 }
    );
  }
}
