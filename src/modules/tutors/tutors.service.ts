import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const SORTS = ["rating", "price_asc", "price_desc", "newest"] as const;
export type TutorSort = (typeof SORTS)[number];

export type ListArgs = {
  q?: string;
  category?: string; // slug
};


export const TutorsService = {
    list: async (args: ListArgs = {}) => {
    const q = (args.q ?? "").trim();
    const categorySlug = (args.category ?? "").trim();

    const where: Prisma.TutorProfileWhereInput = {
      ...(q
        ? {
            OR: [
              { headline: { contains: q, mode: "insensitive" } },
              { bio: { contains: q, mode: "insensitive" } },
              { user: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(categorySlug
        ? {
            categories: {
              some: {
                category: {
                  slug: categorySlug,
                  isActive: true,
                },
              },
            },
          }
        : {}),
    };

    const items = await prisma.tutorProfile.findMany({
      where,
      orderBy: { avgRating: "desc" },
      take: 100,
      select: {
        id: true,
        headline: true,
        hourlyRate: true,
        currency: true,
        avgRating: true,
        reviewCount: true,
        user: { select: { id: true, name: true, image: true } },
        categories: { select: { category: { select: { name: true, slug: true } } } },
      },
    });

    return { items };
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
  
  listReview: async (tutorUserId: string) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { id: tutorUserId },
      select: { id: true, avgRating: true, reviewCount: true },
    });
    if (!profile) throw new Error("Tutor profile not found");

    const items = await prisma.review.findMany({
      where: { tutorProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        student: { select: { id: true, name: true } },
        bookingId: true,
      },
    });

    return {
      summary: {
        avgRating: profile.avgRating ?? 0,
        reviewCount: profile.reviewCount ?? 0,
      },
      items,
    };
  },


};
