import { Request, Response } from "express";
import { CategoriesService } from "./categories.service";


export const CategoriesController = {
  list: async (_req: Request, res: Response) => {
    const result = await CategoriesService.list();
    res.json(result);
  },
};
