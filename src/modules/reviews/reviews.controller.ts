import { Request, Response } from "express";
import { ReviewsService } from "./reviews.service";

export const ReviewsController = {
  create: async (req: Request, res: Response) => {
    const data = await ReviewsService.create(req.user!.id, req.body);
    res.status(201).json(data);
  },
};
