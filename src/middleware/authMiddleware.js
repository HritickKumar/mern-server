import { verifyAccessToken } from "../utils/tokenUtils.js";

export const auth = (req, res, next) => {
    try {
        let token;

        // Bearer token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        // (Optional) or from cookies
        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }

        const decoded = verifyAccessToken(token);
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            roles: decoded.roles || [],
        };

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
