import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises";

export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .select("email name roles profileImageUrl isMFAEnabled")
            .lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

export const uploadProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an image",
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "profile-pictures",
            width: 500,
            height: 500,
            crop: "fill",
            gravity: "face",
            quality: "auto",
            fetch_format: "auto",
        });

        const imageUrl = result.secure_url;

        if (req.user.profileImageUrl) {
            const oldPublicId = req.user.profileImageUrl
                .split("/")
                .slice(-2)
                .join("/")
                .split(".")[0];
            await cloudinary.uploader.destroy(oldPublicId).catch(() => { });
        }

        await fs.unlink(req.file.path).catch(() => { });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profileImageUrl: imageUrl },
            { new: true }
        ).select("name email profileImageUrl");

        return res.json({
            success: true,
            message: "Profile picture updated successfully!",
            data: user,
        });
    } catch (err) {
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(() => { });
        }
        next(err);
    }
};

