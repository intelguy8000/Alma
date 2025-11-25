import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/settings - Get organization settings and custom settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get organization data
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
      },
    });

    // Get custom settings
    const settings = await prisma.setting.findMany({
      where: { organizationId },
    });

    // Convert settings array to object
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    return NextResponse.json({
      organization,
      settings: settingsObj,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Error al cargar configuración" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update organization and custom settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const body = await request.json();
    const { name, logoUrl, primaryColor, settings } = body;

    // Update organization
    if (name !== undefined) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          name,
          logoUrl: logoUrl || null,
          primaryColor: primaryColor || null,
        },
      });
    }

    // Update custom settings
    if (settings && typeof settings === "object") {
      for (const [key, value] of Object.entries(settings)) {
        await prisma.setting.upsert({
          where: {
            organizationId_key: {
              organizationId,
              key,
            },
          },
          update: {
            value: String(value),
          },
          create: {
            organizationId,
            key,
            value: String(value),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}
