import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT, upload.none());

router.route("/").get(createPlaylist);

router.route("/:playlistId").patch(updatePlaylist);
router.route("/:playlistId").delete(deletePlaylist);

router.route("/add/:videoId/playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/playlistId").patch(addVideoToPlaylist);

export default router;