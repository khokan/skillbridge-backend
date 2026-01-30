import { Prisma } from "../../../generated/prisma/client";
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

type AvailabilitySlotInput = { startTime: string; endTime: string };
type SetAvailabilityDto = {
  slots: AvailabilitySlotInput[];
};

export const TutorManageService = {
  updateProfile: async (userId: string, dto: UpdateProfileDto) => {
    const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("Tutor profile not found");

    if (dto.hourlyRate != null && dto.hourlyRate < 0) {
      throw new Error("hourlyRate must be >= 0");
    }

    const data: Prisma.TutorProfileUpdateInput = {};

    if (dto.headline !== undefined) data.headline = dto.headline;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.hourlyRate !== undefined) data.hourlyRate = dto.hourlyRate;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.languages !== undefined) data.languages = dto.languages;
    if (dto.experienceYrs !== undefined) data.experienceYrs = dto.experienceYrs;
    if (dto.education !== undefined) data.education = dto.education;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;

    return prisma.tutorProfile.update({
      where: { id: profile.id },
      data,
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

  getAvailability: async (userId: string) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new Error("Tutor profile not found");

    return prisma.availabilitySlot.findMany({
      where: { tutorProfileId: profile.id },
      orderBy: { startTime: "asc" },
      select: { id: true, startTime: true, endTime: true, isBooked: true },
    });
  },

  setAvailability: async (userId: string, dto: SetAvailabilityDto) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new Error("Tutor profile not found");

    const now = new Date();

    const slots = dto?.slots;
    if (!Array.isArray(slots) || slots.length === 0) throw new Error("slots is required");

    const parsed = slots.map((s) => ({
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
    }));

    for (const s of parsed) {
      if (isNaN(s.startTime.getTime()) || isNaN(s.endTime.getTime())) {
        throw new Error("Invalid date format in slots");
      }
      if (!(s.startTime < s.endTime)) throw new Error("Invalid slot time range");
      if (s.startTime < now) throw new Error("Slot startTime must be in the future");
    }

    // prevent overlaps inside request payload
    parsed.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (let i = 1; i < parsed.length; i++) {
      const prev = parsed[i - 1];
      const curr = parsed[i];
      
        if (!prev || !curr) continue; // TS safety, runtime-safe

      if (curr.startTime < prev.endTime) {
        throw new Error("Overlapping slots in request payload");
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // replace future unbooked slots (safe)
      const deleted = await tx.availabilitySlot.deleteMany({
        where: {
          tutorProfileId: profile.id,
          isBooked: false,
          startTime: { gte: now },
        },
      });

      await tx.availabilitySlot.createMany({
        data: parsed.map((s) => ({
          tutorProfileId: profile.id,
          startTime: s.startTime,
          endTime: s.endTime,
          isBooked: false,
        })),
      });

      const items = await tx.availabilitySlot.findMany({
        where: { tutorProfileId: profile.id },
        orderBy: { startTime: "asc" },
        select: { id: true, startTime: true, endTime: true, isBooked: true },
      });

      return { ok: true, deletedCount: deleted.count, totalSlots: items.length, items };
    });

    return result;
  },
};
