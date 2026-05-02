import { Request, Response } from "express";
import { RAGService } from "./rag.service";

const ragService = new RAGService();

export const RagController = {
  getStats: async (_req: Request, res: Response) => {
    try {
      const result = await ragService.getStats();

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Get RAG stats error:", error);

      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to retrieve RAG stats",
      });
    }
  },

  indexAllTutorProfiles: async (_req: Request, res: Response) => {
    try {
      const result = await ragService.indexAllTutorProfiles();

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Index all tutor profiles error:", error);

      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to index tutor profiles",
      });
    }
  },

  indexTutorProfile: async (req: Request, res: Response) => {
    try {
      const profileId = Array.isArray(req.params.profileId)
        ? req.params.profileId[0]
        : req.params.profileId;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: "profileId is required",
        });
      }

      const result = await ragService.indexTutorProfileById(profileId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Index tutor profile error:", error);

      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to index tutor profile",
      });
    }
  },

  removeTutorProfileIndex: async (req: Request, res: Response) => {
    try {
      const profileId = Array.isArray(req.params.profileId)
        ? req.params.profileId[0]
        : req.params.profileId;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: "profileId is required",
        });
      }

      const result = await ragService.removeTutorProfileIndexById(profileId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Remove tutor profile index error:", error);

      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to remove tutor profile index",
      });
    }
  },

  queryTutorProfiles: async (req: Request, res: Response) => {
    try {
      const { query, limit, asJson } = req.body as {
        query?: string;
        limit?: number;
        asJson?: boolean;
      };

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Query is required",
        });
      }

      const result = await ragService.generateAnswer(
        query,
        limit ?? 5,
        asJson ?? true,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Tutor profile RAG query error:", error);

      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to query tutor profiles",
      });
    }
  },
};