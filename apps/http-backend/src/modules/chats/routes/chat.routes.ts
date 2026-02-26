import {Router} from "express";
import {getChatController} from "../controller/getchat.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router: Router = Router();

router.get("/:roomId",authMiddleware, getChatController);

export default router;