import { prisma } from "../../lib/prisma";

export const BookingsService = {
  create: async (studentId: string, dto: { tutorProfileId: string; startTime: string; endTime: string; price: number; currency?: string }) => {
    if (!dto.tutorProfileId) throw new Error("tutorProfileId is required");

    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { id: dto.tutorProfileId } });
    if (!tutorProfile) throw new Error("Tutor profile not found");

    // Simple booking: instant confirmed
    return prisma.booking.create({
      data: {
        studentId,
        tutorId: tutorProfile.userId,
        tutorProfileId: tutorProfile.id,
        status: "CONFIRMED",
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        price: dto.price,
        currency: dto.currency ?? "BDT",
      },
      select: { id: true, status: true, startTime: true, endTime: true },
    });
  },

  list: async (userId: string, role: string) => {
    const where =
      role === "ADMIN" ? {} :
      role === "TUTOR" ? { tutorId: userId } :
      { studentId: userId };

    return prisma.booking.findMany({
      where,
      orderBy: { startTime: "desc" },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        price: true,
        currency: true,
        tutor: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } },
      },
    });
  },

  cancel: async (studentId: string, bookingId: string) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error("Booking not found");
    if (booking.studentId !== studentId) throw new Error("Forbidden");
    if (booking.status !== "CONFIRMED") throw new Error("Only confirmed bookings can be cancelled");

    return prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  },

  complete: async (tutorId: string, bookingId: string) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error("Booking not found");
    if (booking.tutorId !== tutorId) throw new Error("Forbidden");
    if (booking.status !== "CONFIRMED") throw new Error("Only confirmed bookings can be completed");

    return prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
  },
};
