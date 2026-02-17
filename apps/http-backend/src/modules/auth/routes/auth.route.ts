import { Router } from "express";
import { SigninController } from "../controllers/signin.controller.js";
import { SignupController } from "../controllers/signup.controller.js";

const router: Router = Router();

router.post("/signup", SignupController);
router.post("/signin", SigninController);


export default router;
