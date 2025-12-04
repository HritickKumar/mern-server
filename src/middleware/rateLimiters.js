import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10, // 10 attempts per IP
    message: {
        success: false,
        message: "Too many login attempts, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const otpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many OTP requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
