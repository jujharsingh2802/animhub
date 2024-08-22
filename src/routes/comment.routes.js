import { Router } from "express";
import { addComment, deleteComment, updateComment, viewComments } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT, upload.none());

router.route("/:videoId").post(addComment);
router.route("/:videoId").get(viewComments);

router.route("/c/:commentId").patch(updateComment);
router.route("/c/:commentId").delete(deleteComment);

export default router;
