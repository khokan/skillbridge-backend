import { Router } from "express";
import { TutorsController } from "./tutors.controller";

const router = Router();

// student must be logged in to browse
router.get("/",  TutorsController.list);

// details page for student to view + book
router.get("/:id", TutorsController.details);

// details page for student to view + book
router.get("/reviews/:id", TutorsController.listReview);

export const tutorsRoutes = router;
