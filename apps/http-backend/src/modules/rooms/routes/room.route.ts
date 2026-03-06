import { Router } from "express";
import { joinController } from "../controllers/join.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { createController } from "../controllers/create.controller.js";
import { FetchElementsController } from "../controllers/fetchElements.controller.js";

const router: Router = Router();

router.post("/create", authMiddleware, createController);
router.post("/elements/:roomId", authMiddleware, FetchElementsController)
router.post("/:roomId", authMiddleware, joinController);

export default router;
