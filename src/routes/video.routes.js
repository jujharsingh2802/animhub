import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import { publishAVideo, getAllVideos, deleteVideo, getVideoById, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router();

router.use(verifyJWT);

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
router.route("/v/:videoId").delete(verifyJWT,deleteVideo)
router.route("/v/:videoId").get(verifyJWT, getVideoById)
router.route("/v/:videoId").patch(verifyJWT,upload.fields([{name: "thumbnail",maxCount:1}]),updateVideo);
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);
export default router





