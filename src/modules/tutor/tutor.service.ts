import { prisma } from "../../lib/prisma";

type UpdateProfileDto = {
  headline?: string;
  bio?: string;
  hourlyRate?: number;
  currency?: string;
  languages?: string[];
  experienceYrs?: number;
  education?: string;
  timezone?: string;
};

type SetCategoriesDto = {
  categoryIds: string[]; // replace all categories with these
};

type AvailabilitySlotInput = { startTime: string; endTime: string };
type SetAvailabilityDto = {
  mode?: "REPLACE_FUTURE_UNBOOKED"; // default
  slots: AvailabilitySlotInput[];
};

export const TutorManageService = {
  getMyProfile: async (userId: string) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        headline: true,
        bio: true,
        hourlyRate: true,
        currency: true,
        languages: true,
        experienceYrs: true,
        education: true,
        timezone: true,
        avgRating: true,
        reviewCount: true,
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
      },
    });

    if (!profile) throw new Error("Tutor profile not found");
    return profile;
  },

  updateProfile: async (userId: string, dto: UpdateProfileDto) => {
  const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Tutor profile not found");

  // Basic validation
  if (dto.hourlyRate != null && dto.hourlyRate < 0) {
    throw new Error("hourlyRate must be >= 0");
  }

  // Build update data object, filtering out undefined
  const updateData: any = {};
  
  if (dto.headline !== undefined) updateData.headline = dto.headline;
  if (dto.bio !== undefined) updateData.bio = dto.bio;
  if (dto.hourlyRate !== undefined) updateData.hourlyRate = dto.hourlyRate;
  if (dto.currency !== undefined) updateData.currency = dto.currency;
  if (dto.languages !== undefined) updateData.languages = dto.languages;
  if (dto.experienceYrs !== undefined) updateData.experienceYrs = dto.experienceYrs;
  if (dto.education !== undefined) updateData.education = dto.education;
  if (dto.timezone !== undefined) updateData.timezone = dto.timezone;

  return prisma.tutorProfile.update({
    where: { id: profile.id },
    data: updateData,
    select: {
      id: true,
      headline: true,
      bio: true,
      hourlyRate: true,
      currency: true,
      languages: true,
      experienceYrs: true,
      education: true,
      timezone: true,
    },
  });
},

  setCategories: async (userId: string, dto: SetCategoriesDto) => {
    const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("Tutor profile not found");

    const ids = Array.isArray(dto?.categoryIds) ? dto.categoryIds : [];
    if (!ids.length) throw new Error("categoryIds is required");

    // ensure categories exist & active
    const found = await prisma.category.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true },
    });
    if (found.length !== ids.length) throw new Error("Some categories are invalid/inactive");

    await prisma.$transaction(async (tx) => {
      await tx.tutorCategory.deleteMany({ where: { tutorProfileId: profile.id } });
      await tx.tutorCategory.createMany({
        data: ids.map((categoryId) => ({ tutorProfileId: profile.id, categoryId })),
      });
    });

    return { ok: true };
  },

  setAvailability: async (userId: string, dto: SetAvailabilityDto) => {
    const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("Tutor profile not found");

    const slots = dto?.slots;
    if (!Array.isArray(slots) || slots.length === 0) throw new Error("slots is required");

    const parsed = slots.map((s) => ({
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
    }));

    for (const s of parsed) {
      if (!(s.startTime < s.endTime)) throw new Error("Invalid slot time range");
      if (s.startTime < new Date()) throw new Error("Slot startTime must be in the future");
    }

    // prevent overlaps in the payload itself
    parsed.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (let i = 1; i < parsed.length; i++) {
      // if (parsed[i].startTime < parsed[i - 1].endTime) {
      //   throw new Error("Overlapping slots in request payload");
      // }
    }

    await prisma.$transaction(async (tx) => {
      // replace future unbooked slots (safe + simple)
      await tx.availabilitySlot.deleteMany({
        where: { tutorProfileId: profile.id, isBooked: false, startTime: { gte: new Date() } },
      });

      await tx.availabilitySlot.createMany({
        data: parsed.map((s) => ({
          tutorProfileId: profile.id,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    });

    return { ok: true };
  },

  markBookingCompleted: async (tutorUserId: string, bookingId: string) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, tutorId: true, status: true },
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.tutorId !== tutorUserId) throw new Error("Forbidden");
    if (booking.status !== "CONFIRMED") throw new Error("Only CONFIRMED bookings can be completed");

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED" },
      select: { id: true, status: true },
    });
  },

  cancelBooking: async (tutorUserId: string, bookingId: string) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, tutorId: true, status: true, availabilityId: true },
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.tutorId !== tutorUserId) throw new Error("Forbidden");
    if (booking.status !== "CONFIRMED") throw new Error("Only CONFIRMED bookings can be cancelled");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
        select: { id: true, status: true },
      });

      // free slot again (optional)
      if (booking.availabilityId) {
        await tx.availabilitySlot.update({
          where: { id: booking.availabilityId },
          data: { isBooked: false },
        });
      }

      return updated;
    });
  },
};
