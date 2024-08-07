import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import { publishAVideo, getAllVideos, deleteVideo, getVideoById } from "../controllers/video.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllVideos)
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
router.route("/v/:videoId").delete(verifyJWT,deleteVideo)
router.route("/v/:videoId").get(verifyJWT, getVideoById)

export default router





