import { prisma } from "../../lib/prisma";

type CreateCategoryDto = { name: string; slug?: string; isActive?: boolean };
type UpdateCategoryDto = { name?: string; slug?: string; isActive?: boolean };

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
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  },

  updateUserStatus: async (userId: string, isBanned: boolean) => {
    // prevent banning self? optional. Keep simple:
    return prisma.user.update({
      where: { id: userId },
      data: { isBanned },
      select: { id: true, isBanned: true },
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
