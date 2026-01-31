import { Request, Response } from "express";
import { TutorManageService } from "./tutor.service";

export const TutorManageController = {
  updateProfile: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const updated = await TutorManageService.updateProfile(req.user.id, req.body);

      return res.status(200).json({
        success: true,
        message: "Profile updated",
        data: updated,
      });
    } catch (e: any) {
      console.error("updateProfile error:", e);
      return res.status(400).json({
        success: false,
        message: e?.message ?? "Failed to update profile",
      });
    }
  },

  getAvailability: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const items = await TutorManageService.getAvailability(req.user.id);

      return res.status(200).json({
        success: true,
        data: { items },
      });
    } catch (e: any) {
      console.error("getAvailability error:", e);
      return res.status(400).json({
        success: false,
        message: e?.message ?? "Failed to load availability",
      });
    }
  },

  setAvailability: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const slots = req.body?.slots;
      if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({
          success: false,
          message: "slots is required (array)",
        });
      }

      const result = await TutorManageService.setAvailability(req.user.id, { slots });

      return res.status(200).json({
        success: true,
        message: "Availability updated",
        data: result,
      });
    } catch (e: any) {
      console.error("setAvailability error:", e);
      return res.status(400).json({
        success: false,
        message: e?.message ?? "Failed to update availability",
      });
    }
  },

  setCategories: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const categoryIds = req.body?.categoryIds as string[] | undefined;
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ success: false, message: "categoryIds is required" });
      }

      const result = await TutorManageService.setCategories(req.user.id, { categoryIds });
      return res.json({ success: true, message: "Categories updated", data: result });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
};
