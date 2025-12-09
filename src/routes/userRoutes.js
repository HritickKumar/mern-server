import express from "express";
import { auth } from "../middleware/authMiddleware.js";
// import { requireRole } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { getMe, uploadProfileImage } from "../controllers/userController.js";
import { joiValidate } from "../middleware/joiValidation.js";
import { updateProfileSchema } from "../validators/joiSchemas.js";

const router = express.Router();

router.get("/me", auth, getMe);

router.put("/me", auth, joiValidate({ body: updateProfileSchema }), async (req, res, next) => {
    try {
        const { name } = req.body;
        const updated = await User.findByIdAndUpdate(req.user.id, { name }, { new: true }).select("email name profileImageUrl");
        return res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
});

router.post("/me/profile-image", auth, upload.single("image"), uploadProfileImage);

// router.get("/", auth, requireRole("admin"), listUsers);

export default router;
