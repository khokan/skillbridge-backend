import { Request, Response } from "express";
import { TutorsService } from "./tutors.service";

export const TutorsController = {
  list: async (req: Request, res: Response) => {
    try {
      const items = await TutorsService.list();
      return res.json({ success: true, data: { items } });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e?.message ?? "Failed to load tutors" });
    }
  },

  details: async (req: Request, res: Response) => {
    try {
      const tutor = await TutorsService.details(req.params.id as string);
      return res.json({ success: true, data: tutor });
    } catch (e: any) {
      return res.status(404).json({ success: false, message: e?.message ?? "Tutor not found" });
    }
  },
};
