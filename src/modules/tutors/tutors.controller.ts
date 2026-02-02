import { Request, Response } from "express";
import { TutorsService, TutorSort, ListArgs } from "./tutors.service";

const SORTS: readonly TutorSort[] = ["rating", "price_asc", "price_desc", "newest"] as const;

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const TutorsController = {
 list: async (req: Request, res: Response) => {
    try {
      const q = (req.query.q ?? "").toString();
      const category = (req.query.category ?? "").toString(); // slug

      const args: ListArgs = {};
      if (q.trim()) args.q = q.trim();
      if (category.trim()) args.category = category.trim();
     
      const data = await TutorsService.list(args);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(400).json({
        success: false,
        message: e?.message ?? "Failed",
      });
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
   listReview: async (req: Request, res: Response) => {
    try {
      const data = await TutorsService.listReview(req.params.id as string);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
};
