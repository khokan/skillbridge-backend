import { prisma } from "../../lib/prisma";

export const BookingsService = {
  create: async (studentId: string, dto: { tutorProfileId: string; availabilityId: string }) => {
    if (!dto?.tutorProfileId) throw new Error("tutorProfileId is required");
    if (!dto?.availabilityId) throw new Error("availabilityId is required");

    // 1) slot must exist + belong to this tutorProfile
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: dto.availabilityId },
      select: {
        id: true,
        tutorProfileId: true,
        startTime: true,
        endTime: true,
        isBooked: true,
        tutorProfile: { select: { userId: true, hourlyRate: true, currency: true } },
      },
    });

    if (!slot) throw new Error("Slot not found");
    if (slot.tutorProfileId !== dto.tutorProfileId) throw new Error("Slot does not match tutor profile");
    if (slot.isBooked) throw new Error("Slot already booked");

    // 2) transaction: mark slot booked + create booking
    return prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.update({
        where: { id: slot.id },
        data: { isBooked: true },
      });

      const booking = await tx.booking.create({
        data: {
          studentId,
          tutorId: slot.tutorProfile.userId,
          tutorProfileId: slot.tutorProfileId,
          availabilityId: slot.id,
          status: "CONFIRMED",
          startTime: slot.startTime, // ✅ valid Date from DB
          endTime: slot.endTime,     // ✅ valid Date from DB
          price: slot.tutorProfile.hourlyRate ?? 0,
          currency: slot.tutorProfile.currency ?? "BDT",
        },
        select: { id: true, status: true, startTime: true, endTime: true },
      });

      return booking;
    });
  },

  list: async (userId: string, role: string) => {
    const where =
      role === "admin" ? {} :
      role === "tutor" ? { tutorId: userId } :
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
