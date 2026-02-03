import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { UsersController } from "./users.controller";

const router = Router();

// student/tutor/admin all can use /me
router.get("/me", auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN), UsersController.me);
router.patch("/me", auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN), UsersController.updateMe);

export const userRouter = router;
