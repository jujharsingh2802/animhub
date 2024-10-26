import {Router} from "express"
import { getSubscribedChannels, getUserSubscribers, toggleSubscription } from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();

router.use(verifyJWT, upload.none());

router.route("/c/:channelId").post(toggleSubscription);
router.route("/c/:channelId").get(getUserSubscribers);
router.route("/u/:subscribedId").get(getSubscribedChannels);

export default router