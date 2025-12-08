import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js"
import { getMe, uploadProfileImage } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", auth, getMe);

router.post("/me/profile-image", auth, upload.single("image"), uploadProfileImage);


export default router;
