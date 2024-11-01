import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getAllUserPlaylist, getPlayListById, removeVideoInPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT, upload.none());

router.route("/").post(createPlaylist);
router.route("/:playlistId").get(getPlayListById);

router.route("/:playlistId").patch(updatePlaylist);
router.route("/:playlistId").delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoInPlaylist);

router.route("/user/:userId").get(getAllUserPlaylist);

export default router;