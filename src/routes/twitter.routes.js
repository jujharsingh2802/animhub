import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { createTweet, deleteTweet, getAllTweets, updateTweet } from "../controllers/twitter.controller.js";

const router = Router();

router.use(verifyJWT, upload.none());

router.route("/user/:userId").get(getAllTweets);
router.route("/").post(createTweet);
router.route("/t/:twitterId").patch(updateTweet);
router.route("/t/:twitterId").delete(deleteTweet);

export default router;