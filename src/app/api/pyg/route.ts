import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRealModeEnabled } from "@/lib/realMode";
import { getColombiaToday } from "@/lib/dates";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Fechas requeridas" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if real mode is enabled
    const realModeActive = await isRealModeEnabled(session.user.organizationId);

    // Fetch sales with appointments
    const sales = await prisma.sale.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(realModeActive && { hasElectronicInvoice: true }),
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        appointment: {
          select: {
            type: true,
          },
        },
      },
    });

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where: {
        organizationId: session.user.organizationId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    // Calculate summary
    const totalIncome = sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Group income by appointment type
    const incomeByTypeMap: Record<string, { count: number; amount: number }> = {};
    sales.forEach((sale) => {
      const type = sale.appointment?.type || "sin_cita";
      if (!incomeByTypeMap[type]) {
        incomeByTypeMap[type] = { count: 0, amount: 0 };
      }
      incomeByTypeMap[type].count++;
      incomeByTypeMap[type].amount += Number(sale.amount);
    });

    const incomeByType = Object.entries(incomeByTypeMap).map(([type, data]) => ({
      type,
      label: getAppointmentTypeLabel(type),
      count: data.count,
      amount: data.amount,
    }));

    // Group expenses by category
    const expensesByCategoryMap: Record<string, { count: number; amount: number }> = {};
    expenses.forEach((expense) => {
      const category = expense.category || "sin_categoria";
      if (!expensesByCategoryMap[category]) {
        expensesByCategoryMap[category] = { count: 0, amount: 0 };
      }
      expensesByCategoryMap[category].count++;
      expensesByCategoryMap[category].amount += Number(expense.amount);
    });

    const expensesByCategory = Object.entries(expensesByCategoryMap).map(([category, data]) => ({
      category,
      label: getExpenseCategoryLabel(category),
      count: data.count,
      amount: data.amount,
    }));

    // Get monthly data for last 6 months
    const monthlyData = await getMonthlyData(session.user.organizationId, realModeActive);

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin,
      },
      incomeByType,
      expensesByCategory,
      monthlyData,
    });
  } catch (error) {
    console.error("Error fetching P&G data:", error);
    return NextResponse.json(
      { error: "Error al obtener datos financieros" },
      { status: 500 }
    );
  }
}

async function getMonthlyData(organizationId: string, realModeActive: boolean) {
  const months = [];
  // Use Colombia timezone for consistent month boundaries
  const now = getColombiaToday();

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const [salesData, expensesData] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          organizationId,
          ...(realModeActive && { hasElectronicInvoice: true }),
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.expense.aggregate({
        where: {
          organizationId,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    months.push({
      month: format(monthDate, "yyyy-MM"),
      monthLabel: format(monthDate, "MMM yyyy"),
      income: Number(salesData._sum.amount || 0),
      expenses: Number(expensesData._sum.amount || 0),
    });
  }

  return months;
}

function getAppointmentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    presencial: "Presencial",
    virtual: "Virtual",
    terapia_choque: "Terapia de Choque",
    sin_cita: "Sin cita asociada",
  };
  return labels[type] || type;
}

function getExpenseCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    arriendo: "Arriendo",
    servicios: "Servicios",
    insumos: "Insumos",
    nomina: "Nómina",
    otros: "Otros",
    sin_categoria: "Sin categoría",
  };
  return labels[category] || category;
}
