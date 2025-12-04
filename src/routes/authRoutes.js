import express from "express";
import {
    register,
    login,
    refreshToken,
    logout,
    initiateMFASetup,
    confirmMFASetup,
    disableMFA,
    requestLoginOTP,
    verifyLoginOTP,
} from "../controllers/authController.js";
import { auth } from "../middleware/authMiddleware.js";
import { loginRateLimiter, otpRateLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
    registerValidator,
    loginValidator,
} from "../validators/authValidators.js";

const router = express.Router();

// Register
router.post("/register", validate(registerValidator), register);

// Login (password)
router.post("/login", loginRateLimiter, validate(loginValidator), login);

// Refresh token
router.post("/refresh-token", refreshToken);

// Logout
router.post("/logout", logout);

// MFA
router.post("/mfa/initiate", auth, initiateMFASetup);
router.post("/mfa/confirm", auth, confirmMFASetup);
router.post("/mfa/disable", auth, disableMFA);

// OTP login
router.post("/otp/request", otpRateLimiter, requestLoginOTP);
router.post("/otp/verify", verifyLoginOTP);

export default router;
