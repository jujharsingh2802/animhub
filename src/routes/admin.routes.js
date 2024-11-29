import { Router } from "express";
import { adminLogin } from "../controllers/admin.controller.js";
import { adminMid } from "../middlewares/admin.middleware.js";

const router = Router();
router.use(adminMid);
router.route("/login").post(adminLogin);

export default router;




