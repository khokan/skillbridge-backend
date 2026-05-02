import { prisma } from "../../lib/prisma";
import { RAGService } from "../rag/rag.service";

const ragService = new RAGService();


export const TutorProfileService = {
  create: async (userId: string, data: any) => {
    const profile = await prisma.tutorProfile.create({
      data: { ...data, userId },
    });

    try {
      await ragService.indexTutorProfileById(profile.id);
    } catch (error) {
      console.warn("Failed to index tutor profile after create:", error);
    }

    return profile;
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
        experienceYrs: true,
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
      },
    });
  },

  update: async (userId: string, data: any) => {
    const profile = await prisma.tutorProfile.update({
      where: { userId },
      data,
    });

    try {
      await ragService.indexTutorProfileById(profile.id);
    } catch (error) {
      console.warn("Failed to index tutor profile after update:", error);
    }

    return profile;
  },

  remove: async (userId: string) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    const result = await prisma.tutorProfile.delete({
      where: { userId },
    });

    if (profile) {
      try {
        await ragService.removeTutorProfileIndexById(profile.id);
      } catch (error) {
        console.warn("Failed to remove tutor profile index after delete:", error);
      }
    }

    return result;
  },
};
