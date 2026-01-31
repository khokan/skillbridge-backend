import { prisma } from "../../lib/prisma";

export const TutorsService = {
  list: async () => {
    return prisma.tutorProfile.findMany({
      select: {
        id: true,
        headline: true,
        hourlyRate: true,
        currency: true,
        avgRating: true,
        reviewCount: true,
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { avgRating: "desc" },
    });
  },

  details: async (tutorProfileId: string) => {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      select: {
        id: true,
        headline: true,
        bio: true,
        hourlyRate: true,
        currency: true,
        avgRating: true,
        reviewCount: true,
        user: { select: { id: true, name: true, image: true } },
        availability: {
          where: { isBooked: false },
          select: { id: true, startTime: true, endTime: true },
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!tutor) throw new Error("Tutor not found");
    return tutor;
  },
  
};
