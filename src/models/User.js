import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false, // never return by default
        },
        name: {
            type: String,
            trim: true,
        },
        roles: {
            type: [String],
            enum: ["user", "admin"],
            default: ["user"],
            index: true,
        },

        // Login security
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
            default: null,
        },

        // MFA (Authenticator app)
        isMFAEnabled: {
            type: Boolean,
            default: false,
        },
        mfaSecret: {
            type: String, // base32 secret for TOTP
            select: false,
        },

        // OTP-based login (e.g., email OTP)
        loginOTP: {
            code: { type: String, select: false },
            expiresAt: { type: Date },
        },

        // Profile image URL
        profileImageUrl: {
            type: String,
            default: null,
        },

        // Refresh token tracking (optional)
        refreshTokens: [
            {
                token: { type: String },
                createdAt: { type: Date, default: Date.now },
                userAgent: String,
                ip: String,
            },
        ],
    },
    { timestamps: true }
);

// methods

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.isAccountLocked = function () {
    if (!this.lockUntil) return false;
    return this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = function () {
    const MAX_ATTEMPTS = 3;
    const LOCK_TIME = 30 * 60 * 1000; // 30 min

    if (this.lockUntil && this.lockUntil < Date.now()) {
        // lock expired → reset
        this.failedLoginAttempts = 1;
        this.lockUntil = null;
    } else {
        this.failedLoginAttempts += 1;
        if (this.failedLoginAttempts >= MAX_ATTEMPTS && !this.isAccountLocked()) {
            this.lockUntil = new Date(Date.now() + LOCK_TIME);
        }
    }

    return this.save();
};

userSchema.methods.resetLoginAttempts = function () {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    return this.save();
};

const User = mongoose.model("User", userSchema);
export default User;
