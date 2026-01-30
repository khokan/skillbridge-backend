import { Request, Response } from "express";
import { BookingsService } from "./bookings.service";

export const BookingsController = {
  create: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

      const booking = await BookingsService.create(req.user.id, req.body);

      return res.status(201).json({ success: true, message: "Booking confirmed", data: booking });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message ?? "Failed to create booking" });
    }
  },

  listMineOrAll: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

      const items = await BookingsService.list(req.user.id, req.user.role);

      return res.json({ success: true, data: { items } });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message ?? "Failed to load bookings" });
    }
  },

  cancel: async (req: Request, res: Response) => {
    try {``
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

      const updated = await BookingsService.cancel(req.user.id, req.user.id);

      return res.json({ success: true, message: "Booking cancelled", data: updated });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message ?? "Cancel failed" });
    }
  },

  complete: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

      const updated = await BookingsService.complete(req.user.id, req.user.id);

      return res.json({ success: true, message: "Session marked completed", data: updated });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message ?? "Complete failed" });
    }
  },
};
