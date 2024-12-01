import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { createTweet, deleteTweet, getAllTweets, updateTweet } from "../controllers/twitter.controller.js";

import { verifyAdmin } from "../middlewares/verifyadmin.middleware.js";

const router = Router();
router.use(verifyAdmin);
router.use((req, res, next) => {
    if (req.user?.status === "admin") {
        return next();
    }
    return verifyJWT(req, res, next);
});

router.use(upload.none());

router.route("/user/:userId").get(getAllTweets);
router.route("/").post(createTweet);
router.route("/t/:tweetId").patch(updateTweet);
router.route("/t/:tweetId").delete(deleteTweet);

export default router;