import Joi from "joi";

const passwordPattern =
    Joi.string().min(8).max(128).label("Password");

export const registerSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().label("Email"),
    password: passwordPattern.required(),
    name: Joi.string().trim().min(1).max(100).optional().allow("", null),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().label("Email"),
    password: Joi.string().required().label("Password"),
    mfaToken: Joi.string().trim().length(6).optional().allow("", null),
});

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().label("Refresh Token"),
});

export const logoutSchema = Joi.object({
    refreshToken: Joi.string().optional().allow("", null),
});

export const requestOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().label("Email"),
});

export const verifyOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().label("Email"),
    code: Joi.string().pattern(/^\d{6}$/).required().label("OTP"),
});

export const confirmMfaSchema = Joi.object({
    token: Joi.string().trim().length(6).required().label("MFA Token"),
});

export const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional().allow("", null),
});


export const adminListQuerySchema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    search: Joi.string().allow("", null).optional()
});

export const adminChangeRoleSchema = Joi.object({
    userId: Joi.string().required(),
    roles: Joi.array().items(Joi.string().valid("user", "admin")).required()
});

export const adminBlockSchema = Joi.object({
    userId: Joi.string().required(),
    reason: Joi.string().allow("", null).optional()
});

export const adminInvalidateSchema = Joi.object({
    userId: Joi.string().required()
});
