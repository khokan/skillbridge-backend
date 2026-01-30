import { Request, Response } from "express";
import { TutorManageService } from "./tutor.service";


export const TutorManageController = {
  getMyProfile: async (req: Request, res: Response) => {
    const result = await TutorManageService.getMyProfile(req.user!.id);
    res.json(result);
  },

  updateProfile: async (req: Request, res: Response) => {
    const result = await TutorManageService.updateProfile(req.user!.id, req.body);
    res.json(result);
  },

  setCategories: async (req: Request, res: Response) => {
    const result = await TutorManageService.setCategories(req.user!.id, req.body);
    res.json(result);
  },

  setAvailability: async (req: Request, res: Response) => {
    const result = await TutorManageService.setAvailability(req.user!.id, req.body);
    res.json(result);
  },

  markBookingCompleted: async (req: Request, res: Response) => {
    const result = await TutorManageService.markBookingCompleted(req.user!.id, req.params.id as string);
    res.json(result);
  },

  cancelBooking: async (req: Request, res: Response) => {
    const result = await TutorManageService.cancelBooking(req.user!.id, req.params.id as string);
    res.json(result);
  },
};
