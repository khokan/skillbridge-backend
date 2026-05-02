import { Prisma } from "../../../generated/prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma";
import { EmbeddingService } from "./embedding.service";

type TutorProfileForIndexing = {
  id: string;
  userId: string;
  bio: string | null;
  headline: string | null;
  hourlyRate: number;
  currency: string;
  languages: string[];
  experienceYrs: number;
  education: string | null;
  timezone: string;
  isVerified: boolean;
  avgRating: number;
  reviewCount: number;
  user: {
    name: string;
    email: string;
    role: string | null;
  };
  categories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  reviews: Array<{
    rating: number;
    comment: string | null;
    createdAt: Date;
  }>;
  availability: Array<{
    startTime: Date;
    endTime: Date;
    isBooked: boolean;
  }>;
};

const SOURCE_TYPE = "TUTOR_PROFILE";

const toVectorLiteral = (vector: number[]) => `[${vector.join(",")}]`;

export class IndexingService {
  private readonly embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  private buildTutorProfileContent(profile: TutorProfileForIndexing) {
    const categories = profile.categories
      .map((entry) => entry.category.name)
      .filter(Boolean);

    const reviews = profile.reviews.length > 0
      ? profile.reviews
          .map((review) => {
            const comment = review.comment?.trim() || "No comment";

            return `- Rating: ${review.rating}/5. Comment: ${comment}`;
          })
          .join("\n")
      : "No reviews yet.";

    const availabilityText = profile.availability.length > 0
      ? profile.availability
          .map((slot) => {
            const start = new Date(slot.startTime).toLocaleString();
            const end = new Date(slot.endTime).toLocaleString();
            const status = slot.isBooked ? "Booked" : "Available";
            return `- ${start} to ${end} (${status})`;
          })
          .join("\n")
      : "No availability slots configured.";

    return `Tutor Name: ${profile.user.name}
Headline: ${profile.headline || "N/A"}
Bio: ${profile.bio || "N/A"}
Hourly Rate: ${profile.hourlyRate} ${profile.currency}
Experience: ${profile.experienceYrs} years
Education: ${profile.education || "N/A"}
Timezone: ${profile.timezone}
Languages: ${profile.languages.length > 0 ? profile.languages.join(", ") : "N/A"}
Verified: ${profile.isVerified ? "Yes" : "No"}
Average Rating: ${profile.avgRating}/5 from ${profile.reviewCount} reviews
Categories: ${categories.length > 0 ? categories.join(", ") : "None listed"}

Recent Reviews:
${reviews}

Available Slots:
${availabilityText}`;  
  }

  private buildTutorProfileMetadata(profile: TutorProfileForIndexing) {
    return {
      tutorProfileId: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      headline: profile.headline,
      hourlyRate: profile.hourlyRate,
      currency: profile.currency,
      languages: profile.languages,
      experienceYrs: profile.experienceYrs,
      education: profile.education,
      timezone: profile.timezone,
      isVerified: profile.isVerified,
      avgRating: profile.avgRating,
      reviewCount: profile.reviewCount,
      categories: profile.categories.map((entry) => ({
        id: entry.category.id,
        name: entry.category.name,
        slug: entry.category.slug,
      })),
    };
  }

  private async fetchTutorProfileById(profileId: string) {
    return prisma.tutorProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          select: {
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        availability: {
          select: {
            startTime: true,
            endTime: true,
            isBooked: true,
          },
        },
      },
    });
  }

  private async upsertDocument(
    chunkKey: string,
    sourceId: string,
    sourceLabel: string,
    content: string,
    metadata: Record<string, unknown>,
  ) {
    const embedding = await this.embeddingService.generateEmbedding(content);
    const vectorLiteral = toVectorLiteral(embedding);
    const embeddingId = randomUUID();

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "document_embeddings"
      (
        "id",
        "chunkKey",
        "sourceType",
        "sourceId",
        "sourceLabel",
        "content",
        "metadata",
        "embedding",
        "isDeleted",
        "deletedAt",
        "updatedAt"
      )
      VALUES
      (
        ${embeddingId},
        ${chunkKey},
        ${SOURCE_TYPE},
        ${sourceId},
        ${sourceLabel},
        ${content},
        ${JSON.stringify(metadata)}::jsonb,
        CAST(${vectorLiteral} AS vector),
        false,
        null,
        NOW()
      )
      ON CONFLICT ("chunkKey")
      DO UPDATE SET
        "sourceType" = EXCLUDED."sourceType",
        "sourceId" = EXCLUDED."sourceId",
        "sourceLabel" = EXCLUDED."sourceLabel",
        "content" = EXCLUDED."content",
        "metadata" = EXCLUDED."metadata",
        "embedding" = EXCLUDED."embedding",
        "isDeleted" = false,
        "deletedAt" = null,
        "updatedAt" = NOW()
    `);
  }

  async indexTutorProfileById(profileId: string) {
    const profile = await this.fetchTutorProfileById(profileId);

    if (!profile) {
      throw new Error(`Tutor profile with ID ${profileId} not found`);
    }

    const typedProfile = profile as TutorProfileForIndexing;
    const content = this.buildTutorProfileContent(typedProfile);
    const metadata = this.buildTutorProfileMetadata(typedProfile);

    await this.upsertDocument(
      `tutor-profile-${profile.id}`,
      profile.id,
      profile.user.name,
      content,
      metadata,
    );

    return {
      success: true,
      message: `Tutor profile "${profile.user.name}" indexed successfully`,
      tutorProfileId: profile.id,
    };
  }

  async indexTutorProfileByUserId(userId: string) {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new Error(`Tutor profile for user ${userId} not found`);
    }

    return this.indexTutorProfileById(profile.id);
  }

  async indexAllTutorProfiles() {
    const profiles = await prisma.tutorProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          select: {
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        availability: {
          select: {
            startTime: true,
            endTime: true,
            isBooked: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    let indexedCount = 0;
    let failedCount = 0;

    for (const profile of profiles) {
      try {
        const typedProfile = profile as TutorProfileForIndexing;
        const content = this.buildTutorProfileContent(typedProfile);
        const metadata = this.buildTutorProfileMetadata(typedProfile);

        await this.upsertDocument(
          `tutor-profile-${profile.id}`,
          profile.id,
          profile.user.name,
          content,
          metadata,
        );

        indexedCount += 1;
      } catch (error) {
        failedCount += 1;
        console.error(`Error indexing tutor profile ${profile.id}:`, error);
      }
    }

    return {
      success: true,
      totalProfiles: profiles.length,
      indexedCount,
      failedCount,
    };
  }

  async deleteTutorProfileIndexById(profileId: string) {
    const result = await prisma.$executeRaw(Prisma.sql`
      UPDATE "document_embeddings"
      SET "isDeleted" = true,
          "deletedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE "chunkKey" = ${`tutor-profile-${profileId}`}
    `);

    return {
      success: true,
      tutorProfileId: profileId,
      updatedRows: Number(result),
    };
  }

  async deleteTutorProfileIndexByUserId(userId: string) {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return {
        success: true,
        tutorProfileId: null,
        updatedRows: 0,
      };
    }

    return this.deleteTutorProfileIndexById(profile.id);
  }

  async getStats() {
    const totalDocuments = await prisma.$queryRaw<Array<{ count: string }>>(Prisma.sql`
      SELECT COUNT(*)::text AS count
      FROM "document_embeddings"
      WHERE "isDeleted" = false
        AND "sourceType" = ${SOURCE_TYPE}
    `);

    const sourceTypeCounts = await prisma.$queryRaw<
      Array<{ sourceType: string; count: string }>
    >(Prisma.sql`
      SELECT "sourceType", COUNT(*)::text AS count
      FROM "document_embeddings"
      WHERE "isDeleted" = false
      GROUP BY "sourceType"
    `);

    return {
      sourceType: SOURCE_TYPE,
      totalActiveDocuments: Number(totalDocuments[0]?.count ?? 0),
      sourceTypeBreakdown: sourceTypeCounts.reduce<Record<string, number>>(
        (accumulator, current) => {
          accumulator[current.sourceType] = Number(current.count);
          return accumulator;
        },
        {},
      ),
      timestamp: new Date(),
    };
  }
}