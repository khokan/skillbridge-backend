import { Request, Response } from "express";
import { AdminService } from "./admin.service";

export const AdminController = {
  stats: async (req: Request, res: Response) => {
    try {
      const data = await AdminService.stats();
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },

  listUsers: async (req: Request, res: Response) => {
    try {
      const items = await AdminService.listUsers();
      return res.json({ success: true, data: { items } });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },

updateUserStatus: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      const status = req.body?.status as string | undefined;
      if (!status) {
        return res.status(400).json({ success: false, message: "status is required" });
      }

      const updated = await AdminService.updateUserStatus(userId, status);
      return res.json({ success: true, message: "User status updated", data: updated });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
  listBookings: async (req: Request, res: Response) => {
    try {
      const items = await AdminService.listBookings();
      return res.json({ success: true, data: { items } });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },

  listCategories: async (req: Request, res: Response) => {
    try {
      const items = await AdminService.listCategories();
      return res.json({ success: true, data: { items } });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },

  createCategory: async (req: Request, res: Response) => {
    try {
      const created = await AdminService.createCategory(req.body);
      return res.status(201).json({ success: true, message: "Category created", data: created });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },

  updateCategory: async (req: Request, res: Response) => {
    try {
      const updated = await AdminService.updateCategory(req.params.id, req.body);
      return res.json({ success: true, message: "Category updated", data: updated });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },

  deleteCategory: async (req: Request, res: Response) => {
    try {
      await AdminService.deleteCategory(req.params.id as string);
      return res.json({ success: true, message: "Category deleted" });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
};
