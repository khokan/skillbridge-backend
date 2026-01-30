import { prisma } from "../../lib/prisma";

type CreateReviewDto = {
  bookingId: string;
  rating: number; // 1..5
  comment?: string;
};

export const ReviewsService = {
  create: async (studentId: string, dto: CreateReviewDto) => {
    if (dto.rating < 1 || dto.rating > 5) throw new Error("Rating must be 1..5");

    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: dto.bookingId },
        include: { tutorProfile: true },
      });
      if (!booking) throw new Error("Booking not found");
      if (booking.studentId !== studentId) throw new Error("Forbidden");
      if (booking.status !== "COMPLETED") throw new Error("You can review only after completion");

      const review = await tx.review.create({
       data: {
        bookingId: booking.id,
        tutorProfileId: booking.tutorProfileId,
        studentId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null, // Trim and handle empty comments
      },
        
      });

      // update tutor rating stats
      const agg = await tx.review.aggregate({
        where: { tutorProfileId: booking.tutorProfileId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.tutorProfile.update({
        where: { id: booking.tutorProfileId },
        data: {
          avgRating: agg._avg.rating ?? 0,
          reviewCount: agg._count.rating,
        },
      });

      return { id: review.id };
    });
  },
};
