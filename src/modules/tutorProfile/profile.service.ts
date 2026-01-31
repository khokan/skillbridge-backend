import { prisma } from "../../lib/prisma";


export const TutorProfileService = {
  create: async (userId: string, data: any) => {
    return prisma.tutorProfile.create({
      data: { ...data, userId },
    });
  },

  getMine: async (userId: string) => {
    return prisma.tutorProfile.findUnique({
    where: { userId },
      select: {
        id: true,
        bio: true,
        languages: true,
        hourlyRate: true,
        currency: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
      },
    });
  },

  update: async (userId: string, data: any) => {
    return prisma.tutorProfile.update({
      where: { userId },
      data,
    });
  },

  remove: async (userId: string) => {
    return prisma.tutorProfile.delete({
      where: { userId },
    });
  },
};
