import jwt from "jsonwebtoken";
import {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRES,
    REFRESH_TOKEN_EXPIRES,
} from "../config/env.js";

export const generateAccessToken = (user) => {
    const payload = {
        sub: user._id,
        email: user.email,
        roles: user.roles,
    };

    return jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES || "15m",
    });
};

export const generateRefreshToken = (user) => {
    const payload = {
        sub: user._id,
        type: "refresh",
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES || "7d",
    });
};

export const verifyAccessToken = (token) =>
    jwt.verify(token, JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
    jwt.verify(token, JWT_REFRESH_SECRET);
