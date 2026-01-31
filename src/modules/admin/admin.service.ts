import { prisma } from "../../lib/prisma";

type CreateCategoryDto = { name: string; slug?: string; isActive?: boolean };
type UpdateCategoryDto = { name?: string; slug?: string; isActive?: boolean };

  const ALLOWED_STATUS = new Set(["ACTIVE", "BANNED"]);

export const AdminService = {

  stats: async () => {
    const [userCount, tutorCount, studentCount, bookingCount, categoryCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "tutor" } }),
      prisma.user.count({ where: { role: "student" } }),
      prisma.booking.count(),
      prisma.category.count(),
    ]);

    const bookingByStatus = await prisma.booking.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    return {
      userCount,
      tutorCount,
      studentCount,
      bookingCount,
      categoryCount,
      bookingByStatus,
    };
  },

listUsers: async () => {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  },

updateUserStatus: async (userId: string, status: string) => {
    const next = status.toUpperCase();
    if (!ALLOWED_STATUS.has(next)) throw new Error("Invalid status. Use ACTIVE or BANNED");

    return prisma.user.update({
      where: { id: userId },
      data: { status: next },
      select: { id: true, status: true },
    });
  },

  listBookings: async () => {
    return prisma.booking.findMany({
      orderBy: { startTime: "desc" },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        price: true,
        currency: true,
        student: { select: { id: true, name: true, email: true } },
        tutor: { select: { id: true, name: true, email: true } },
        tutorProfileId: true,
      },
    });
  },

  listCategories: async () => {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, isActive: true },
    });
  },

  createCategory: async (dto: CreateCategoryDto) => {
    if (!dto?.name?.trim()) throw new Error("name is required");

    const slug = (dto.slug?.trim() || dto.name.trim().toLowerCase().replace(/\s+/g, "-"))
      .replace(/[^a-z0-9-]/g, "");

    return prisma.category.create({
      data: { name: dto.name.trim(), slug, isActive: dto.isActive ?? true },
      select: { id: true, name: true, slug: true, isActive: true },
    });
  },

  updateCategory: async (id: string, dto: UpdateCategoryDto) => {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.slug !== undefined) data.slug = dto.slug.trim();
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return prisma.category.update({
      where: { id },
      data,
      select: { id: true, name: true, slug: true, isActive: true },
    });
  },

  deleteCategory: async (id: string) => {
    await prisma.category.delete({ where: { id } });
    return { ok: true };
  },
};
