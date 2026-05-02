import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { BookingsController } from "./bookings.controller";

const router = Router();

// all booking endpoints require login
router.use(auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN));

router.post("/", auth(UserRole.STUDENT), BookingsController.create);
router.get("/",  auth(UserRole.STUDENT, UserRole.TUTOR),BookingsController.listMineOrAll);
router.patch("/:id/cancel", auth(UserRole.STUDENT), BookingsController.cancel);
router.patch("/:id/complete", auth(UserRole.TUTOR), BookingsController.complete);

export const bookingRouter = router;
