import { Router } from "express";
import { CategoriesController } from "./categories.controller";


const router = Router();

router.get("/", CategoriesController.list); // GET /api/categories

export const categoriesRoutes = router;
