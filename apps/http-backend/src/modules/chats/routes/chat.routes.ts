import {Router} from "express";
import {getChatController} from "../controller/getchat.controller.js";

const router: Router = Router();

router.get("/:roomId", getChatController);

export default router;