import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import { publishAVideo, getAllVideos, deleteVideo, getVideoById, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { verifyAdmin } from "../middlewares/verifyadmin.middleware.js";

const router = Router();

router.use(verifyAdmin);
router.use((req, res, next) => {
    if (req.user?.status === "admin") {
        return next();
    }
    return verifyJWT(req, res, next);
});

router.route("/").post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    )
    
router.route("/").get(getAllVideos)
router.route("/v/:videoId").delete(deleteVideo)
router.route("/v/:videoId").get(getVideoById)
router.route("/v/:videoId").patch(
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    updateVideo
);
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router





