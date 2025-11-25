import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      orderBy: { alias: "asc" },
    });

    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { error: "Error al obtener cuentas bancarias" },
      { status: 500 }
    );
  }
}
