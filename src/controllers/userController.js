import User from "../models/User.js";

// Get current user profile
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

// This would actually upload to cloud and return URL.
// For now, we simulate using a fake URL from file name.
export const uploadProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, message: "Image file required" });
        }

        // Here you'd do cloud upload, example:
        // const result = await cloudinary.uploader.upload_stream(...buffer...)
        // For demo:
        const fakeUrl = `https://example.com/images/${req.file.originalname}`;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profileImageUrl: fakeUrl },
            { new: true }
        ).select("email name profileImageUrl");

        return res.json({
            success: true,
            message: "Profile image updated",
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// Admin-only: list users with query optimization
export const listUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const query = {};
        if (search) {
            query.email = { $regex: search, $options: "i" };
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select("email name roles createdAt")
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(), // lean() for performance
            User.countDocuments(query),
        ]);

        return res.json({
            success: true,
            data: users,
            meta: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        next(err);
    }
};
