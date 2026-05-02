import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { EmbeddingService } from "./embedding.service";
import { IndexingService } from "./indexing.service";
import { LLMService } from "./llm.service";

type RelevantTutorProfile = {
  id: string;
  chunkKey: string;
  sourceType: string;
  sourceId: string;
  sourceLabel: string | null;
  content: string;
  metadata: unknown;
  similarity: number;
};

const SOURCE_TYPE = "TUTOR_PROFILE";

export class RAGService {
  private readonly embeddingService: EmbeddingService;
  private readonly indexingService: IndexingService;
  private readonly llmService: LLMService;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.indexingService = new IndexingService();
    this.llmService = new LLMService();
  }

  async indexTutorProfileById(profileId: string) {
    return this.indexingService.indexTutorProfileById(profileId);
  }

  async indexTutorProfileByUserId(userId: string) {
    return this.indexingService.indexTutorProfileByUserId(userId);
  }

  async indexAllTutorProfiles() {
    return this.indexingService.indexAllTutorProfiles();
  }

  async removeTutorProfileIndexById(profileId: string) {
    return this.indexingService.deleteTutorProfileIndexById(profileId);
  }

  async removeTutorProfileIndexByUserId(userId: string) {
    return this.indexingService.deleteTutorProfileIndexByUserId(userId);
  }

  async getStats() {
    return this.indexingService.getStats();
  }

  async retrieveRelevantTutorProfiles(query: string, limit = 5) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    return prisma.$queryRaw<RelevantTutorProfile[]>(Prisma.sql`
      SELECT
        id,
        "chunkKey",
        "sourceType",
        "sourceId",
        "sourceLabel",
        content,
        metadata,
        1 - (embedding <=> CAST(${vectorLiteral} AS vector)) AS similarity
      FROM "document_embeddings"
      WHERE "isDeleted" = false
        AND "sourceType" = ${SOURCE_TYPE}
      ORDER BY embedding <=> CAST(${vectorLiteral} AS vector)
      LIMIT ${limit}
    `);
  }

  async generateAnswer(
    query: string,
    limit = 5,
    asJson = false,
  ) {
    const relevantDocs = await this.retrieveRelevantTutorProfiles(query, limit);

    if (relevantDocs.length === 0) {
      return {
        answer: asJson
          ? {
              recommendations: [],
              summary: "No indexed tutor profiles are available yet.",
            }
          : "No indexed tutor profiles are available yet.",
        sources: [],
        contextUsed: false,
      };
    }

    const context = relevantDocs
      .filter((document) => document.content)
      .map((document) => document.content);

    let answer = await this.llmService.generateResponse(query, context, asJson);

    if (asJson) {
      try {
        if (answer.startsWith("```json")) {
          answer = answer.replace(/```json\n?/, "").replace(/```$/, "").trim();
        } else if (answer.startsWith("```")) {
          answer = answer.replace(/```\n?/, "").replace(/```$/, "").trim();
        }

        return {
          answer: JSON.parse(answer) as unknown,
          sources: relevantDocs.map((document) => ({
            id: document.id,
            chunkKey: document.chunkKey,
            sourceType: document.sourceType,
            sourceId: document.sourceId,
            sourceLabel: document.sourceLabel,
            content: document.content,
            metadata: document.metadata,
            similarity: document.similarity,
          })),
          contextUsed: context.length > 0,
        };
      } catch (error) {
        console.error("Failed to parse LLM JSON response:", error);
        throw error;
      }
    }

    return {
      answer,
      sources: relevantDocs.map((document) => ({
        id: document.id,
        chunkKey: document.chunkKey,
        sourceType: document.sourceType,
        sourceId: document.sourceId,
        sourceLabel: document.sourceLabel,
        content: document.content,
        metadata: document.metadata,
        similarity: document.similarity,
      })),
      contextUsed: context.length > 0,
    };
  }
}