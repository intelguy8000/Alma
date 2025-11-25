import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/users/[id] - Get user by id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden ver usuarios" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Error al cargar usuario" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden editar usuarios" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { fullName, email, role, isActive } = body;

    // Verify user belongs to organization
    const existing = await prisma.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Check if trying to deactivate the only admin
    if (isActive === false && existing.role === "admin") {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: session.user.organizationId,
          role: "admin",
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No se puede desactivar el único administrador" },
          { status: 400 }
        );
      }
    }

    // Check if trying to change role of the only admin
    if (role && role !== "admin" && existing.role === "admin") {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: session.user.organizationId,
          role: "admin",
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No se puede cambiar el rol del único administrador" },
          { status: 400 }
        );
      }
    }

    // Check if email is being changed and if it's already taken
    if (email && email.toLowerCase().trim() !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Ya existe un usuario con este email" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName: fullName?.trim() || existing.fullName,
        email: email?.toLowerCase().trim() || existing.email,
        role: role || existing.role,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (soft delete - deactivate)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden eliminar usuarios" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Cannot delete yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    // Verify user belongs to organization
    const existing = await prisma.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Check if trying to delete the only admin
    if (existing.role === "admin") {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: session.user.organizationId,
          role: "admin",
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No se puede eliminar el único administrador" },
          { status: 400 }
        );
      }
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
