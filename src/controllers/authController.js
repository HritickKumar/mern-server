import bcrypt from "bcrypt";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../utils/tokenUtils.js";
import { generateMFASecret, verifyMFAToken, generateOTP } from "../utils/otpUtils.js";

// Helper: save refresh token (optional)
const saveRefreshToken = async (userId, token, req) => {
    const decoded = verifyRefreshToken(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await RefreshToken.create({
        user: userId,
        token,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        expiresAt,
    });
};

// REGISTER
export const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        const existing = await User.findOne({ email }).lean();
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = await User.create({
            email,
            passwordHash,
            name,
            roles: ["user"],
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password, mfaToken } = req.body;

        const user = await User.findOne({ email }).select("+passwordHash +mfaSecret");
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials" });
        }

        // Check account lock
        if (user.isAccountLocked()) {
            return res.status(423).json({
                success: false,
                message: "Account locked due to multiple failed attempts. Try later.",
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.incrementLoginAttempts();
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials" });
        }

        await user.resetLoginAttempts();

        if (user.isMFAEnabled) {
            if (!mfaToken) {
                return res.status(206).json({
                    success: false,
                    message: "MFA token required",
                    mfaRequired: true,
                });
            }

            const isValidMFA = verifyMFAToken(user.mfaSecret, mfaToken);
            if (!isValidMFA) {
                return res
                    .status(400)
                    .json({ success: false, message: "Invalid MFA token" });
            }
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await saveRefreshToken(user._id, refreshToken, req);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    roles: user.roles,
                    isMFAEnabled: user.isMFAEnabled,
                },
            },
        });
    } catch (err) {
        next(err);
    }
};

// REFRESH TOKEN
export const refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "No refresh token provided",
            });
        }

        const stored = await RefreshToken.findOne({ token: refreshToken }).populate(
            "user"
        );
        if (!stored || !stored.user) {
            res.clearCookie("refreshToken");
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (decoded.sub.toString() !== stored.user._id.toString()) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid refresh token" });
        }

        const accessToken = generateAccessToken(stored.user);
        const newRefreshToken = generateRefreshToken(stored.user);

        stored.token = newRefreshToken;
        const decodedNew = verifyRefreshToken(newRefreshToken);
        stored.expiresAt = new Date(decodedNew.exp * 1000);
        await stored.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            data: {
                accessToken,
            },
        });
    } catch (err) {
        next(err);
    }
};

// LOGOUT
export const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await RefreshToken.deleteOne({ token: refreshToken });
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });

        return res.json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (err) {
        next(err);
    }
};

// MFA SETUP (Generate secret and QR)
export const initiateMFASetup = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { base32, qrCodeDataUrl } = await generateMFASecret(user.email);

        // store secret temporarily, MFA not enabled until verified
        user.mfaSecret = base32;
        await user.save();

        return res.json({
            success: true,
            data: {
                qrCodeDataUrl,
                secret: base32,
            },
        });
    } catch (err) {
        next(err);
    }
};

// Confirm MFA enable
export const confirmMFASetup = async (req, res, next) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.id).select("+mfaSecret");
        if (!user || !user.mfaSecret) {
            return res
                .status(400)
                .json({ success: false, message: "MFA setup not initiated" });
        }

        const isValid = verifyMFAToken(user.mfaSecret, token);
        if (!isValid) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid MFA token" });
        }

        user.isMFAEnabled = true;
        await user.save();

        return res.json({
            success: true,
            message: "MFA enabled successfully",
        });
    } catch (err) {
        next(err);
    }
};

// Disable MFA
export const disableMFA = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("+mfaSecret");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.isMFAEnabled = false;
        user.mfaSecret = null;
        await user.save();

        return res.json({
            success: true,
            message: "MFA disabled",
        });
    } catch (err) {
        next(err);
    }
};

// OTP LOGIN (request OTP)
export const requestLoginOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // do not reveal whether email exists
            return res.json({
                success: true,
                message: "If account exists, OTP sent",
            });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

        user.loginOTP = { code: otp, expiresAt };
        await user.save();

        // TODO: send OTP via email/SMS
        console.log("OTP for", email, ":", otp);

        return res.json({
            success: true,
            message: "If account exists, OTP sent",
        });
    } catch (err) {
        next(err);
    }
};

export const verifyLoginOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (
            !user ||
            !user.loginOTP ||
            user.loginOTP.code !== otp ||
            user.loginOTP.expiresAt < new Date()
        ) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid or expired OTP" });
        }

        // clear OTP
        user.loginOTP = undefined;
        await user.save();

        // generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // save refresh token record
        await saveRefreshToken(user._id, refreshToken, req);

        // set refresh token cookie (same as in login)
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: "Login successful",
            data: {
                accessToken,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    roles: user.roles,
                    isMFAEnabled: user.isMFAEnabled,
                },
            },
        });
    } catch (err) {
        next(err);
    }
};
