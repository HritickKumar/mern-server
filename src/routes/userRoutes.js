import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { getMe, uploadProfileImage, listUsers } from "../controllers/userController.js";

const router = express.Router();

// Current user
router.get("/me", auth, getMe);

// Profile image upload
router.post("/me/profile-image", auth, upload.single("image"), uploadProfileImage);

// Admin only route
router.get("/", auth, requireRole("admin"), listUsers);

export default router;
