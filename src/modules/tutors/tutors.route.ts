import { Router } from "express";
import { TutorsController } from "./tutors.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = Router();

// student must be logged in to browse
router.get("/",  TutorsController.list);

// details page for student to view + book
router.get("/:id", TutorsController.details);

export const tutorsRoutes = router;
