import { Router } from "express";

import { TutorManageController } from "./tutor.controller";
import auth, { UserRole } from "../../middlewares/auth";


const router = Router();

router.use(auth(UserRole.TUTOR));

router.put("/profile", TutorManageController.updateProfile);
router.put("/availability", TutorManageController.setAvailability);

export const tutorRoutes = router;
