import { Router } from "express";
import { TutorProfileController } from "./profile.controller";
import auth, { UserRole } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";



const router = Router();

router.use(auth(UserRole.TUTOR));

router.post("/", TutorProfileController.create);
router.get("/me", TutorProfileController.getMine);
router.patch("/", TutorProfileController.update);
router.delete("/", TutorProfileController.remove);

export const profileRouter = router;
