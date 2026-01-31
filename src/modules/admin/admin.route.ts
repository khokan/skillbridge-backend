import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { AdminController } from "./admin.controller";


const router = Router();

// all admin routes protected
router.get("/stats", auth(UserRole.ADMIN), AdminController.stats);

// users
router.get("/users", auth(UserRole.ADMIN), AdminController.listUsers);
router.patch("/users/:id/status", auth(UserRole.ADMIN), AdminController.updateUserStatus);

// bookings
router.get("/bookings", auth(UserRole.ADMIN), AdminController.listBookings);

// categories
router.get("/categories", auth(UserRole.ADMIN), AdminController.listCategories);
router.post("/categories", auth(UserRole.ADMIN), AdminController.createCategory);
router.patch("/categories/:id", auth(UserRole.ADMIN), AdminController.updateCategory);
router.delete("/categories/:id", auth(UserRole.ADMIN), AdminController.deleteCategory);

export const adminRouter = router;
