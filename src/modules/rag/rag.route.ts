import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { RagController } from "./rag.controller";

const router = Router();

router.get("/stats", auth(UserRole.ADMIN), RagController.getStats);
router.post("/index", auth(UserRole.ADMIN), RagController.indexAllTutorProfiles);
router.post(
  "/index/:profileId",
  auth(UserRole.ADMIN, UserRole.TUTOR),
  RagController.indexTutorProfile,
);
router.delete(
  "/index/:profileId",
  auth(UserRole.ADMIN, UserRole.TUTOR),
  RagController.removeTutorProfileIndex,
);
router.post(
  "/query",
  RagController.queryTutorProfiles,
);

export const ragRoutes = router;