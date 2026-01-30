import { Router } from "express";

import { ReviewsController } from "./reviews.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = Router();

router.post("/", auth(UserRole.STUDENT), ReviewsController.create);

export default router;
