import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import mongoose from "mongoose";

export const adminListUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = "" } = req.query;
        const q = {};
        if (search) q.email = { $regex: search, $options: "i" };

        const [users, total] = await Promise.all([
            User.find(q).select("email name roles isMFAEnabled failedLoginAttempts lockUntil createdAt profileImageUrl").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            User.countDocuments(q)
        ]);

        res.json({ success: true, data: users, meta: { total, page, pages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
};

export const adminGetUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid id" });
        const user = await User.findById(id).select("-passwordHash -mfaSecret -loginOTP").lean();
        if (!user) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, data: user });
    } catch (err) { next(err); }
};

export const adminChangeRole = async (req, res, next) => {
    try {
        const { userId, roles } = req.body;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "Invalid userId" });

        const user = await User.findByIdAndUpdate(userId, { roles }, { new: true }).select("email roles");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // optionally invalidate sessions if removed admin
        await RefreshToken.deleteMany({ user: userId });

        res.json({ success: true, message: "User roles updated", data: user });
    } catch (err) { next(err); }
};

export const adminBlockUser = async (req, res, next) => {
    try {
        const { userId, reason } = req.body;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "Invalid userId" });

        // block by setting lockUntil far in the future or a blocked flag (prefer adding a 'blocked' flag)
        const lockUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1 year
        const user = await User.findByIdAndUpdate(userId, { lockUntil, blockedReason: reason }, { new: true }).select("email lockUntil blockedReason");
        await RefreshToken.deleteMany({ user: userId }); // force logout
        res.json({ success: true, message: "User blocked", data: user });
    } catch (err) { next(err); }
};

export const adminUnblockUser = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "Invalid userId" });

        const user = await User.findByIdAndUpdate(userId, { lockUntil: null, failedLoginAttempts: 0, blockedReason: null }, { new: true }).select("email lockUntil");
        res.json({ success: true, message: "User unblocked", data: user });
    } catch (err) { next(err); }
};

export const adminInvalidateUserSessions = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "Invalid userId" });
        await RefreshToken.deleteMany({ user: userId });
        res.json({ success: true, message: "User sessions invalidated" });
    } catch (err) { next(err); }
};
