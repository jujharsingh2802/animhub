import {Router} from "express"
import { toggleSubscription } from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();

router.use(verifyJWT, upload.none());

router.route("/:channelId").post(toggleSubscription);

export default router