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
import { adminLogin } from "../controllers/authController.js";
import { auth } from "../middleware/authMiddleware.js";
import { loginRateLimiter, otpRateLimiter } from "../middleware/rateLimiters.js";
import { joiValidate } from "../middleware/joiValidation.js";
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    logoutSchema,
    requestOtpSchema,
    verifyOtpSchema,
    confirmMfaSchema,
} from "../validators/joiSchemas.js";

const router = express.Router();

router.post("/register", joiValidate({ body: registerSchema }), register);
router.post("/login", loginRateLimiter, joiValidate({ body: loginSchema }), login);
router.post("/refresh-token", joiValidate({ body: refreshTokenSchema }), refreshToken);
router.post("/logout", joiValidate({ body: logoutSchema }), logout)
router.post("/mfa/initiate", auth, initiateMFASetup);
router.post("/mfa/confirm", auth, joiValidate({ body: confirmMfaSchema }), confirmMFASetup);
router.post("/mfa/disable", auth, disableMFA);
router.post("/otp/request", otpRateLimiter, joiValidate({ body: requestOtpSchema }), requestLoginOTP);
router.post("/otp/verify", joiValidate({ body: verifyOtpSchema }), verifyLoginOTP);


router.post("/admin/login", joiValidate({ body: loginSchema }), adminLogin);

export default router;
