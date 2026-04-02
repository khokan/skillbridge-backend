import { Request, Response } from "express";
import { SubscriptionService } from "./subscription.service";

export const SubscriptionController = {
  create: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: "planId is required",
        });
      }

      const subscription = await SubscriptionService.create(req.user.id, planId);

      return res.status(201).json({
        success: true,
        message: "Subscription created successfully",
        data: subscription,
      });
    } catch (e: any) {
      return res.status(400).json({
        success: false,
        message: e.message ?? "Failed to create subscription",
      });
    }
  },

  initiatePayment: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const subscriptionId = req.params.id;

      if (!subscriptionId) {
        return res.status(400).json({
          success: false,
          message: "subscriptionId is required",
        });
      }

      const data = await SubscriptionService.initiatePayment(req.user.id, subscriptionId);

      return res.json({
        success: true,
        message: "Payment initiated",
        data,
      });
    } catch (e: any) {
      return res.status(400).json({
        success: false,
        message: e.message ?? "Payment initiation failed",
      });
    }
  },
 
  listMineOrAll: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const items = await SubscriptionService.list(req.user.id, req.user.role);

      return res.json({
        success: true,
        data: { items },
      });
    } catch (e: any) {
      return res.status(500).json({
        success: false,
        message: e.message ?? "Failed to load subscriptions",
      });
    }
  },

  getMyActive: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const subscription = await SubscriptionService.getMyActive(req.user.id);

      return res.json({
        success: true,
        data: subscription,
      });
    } catch (e: any) {
      return res.status(400).json({
        success: false,
        message: e.message ?? "Failed to load active subscription",
      });
    }
  },

  cancel: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const subscriptionId = req.params.id;

      if (!subscriptionId) {
        return res.status(400).json({
          success: false,
          message: "subscriptionId is required",
        });
      }

      const updated = await SubscriptionService.cancel(req.user.id, subscriptionId);

      return res.json({
        success: true,
        message: "Subscription cancelled successfully",
        data: updated,
      });
    } catch (e: any) {
      return res.status(400).json({
        success: false,
        message: e.message ?? "Cancel failed",
      });
    }
  },
};