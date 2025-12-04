export const requireRole = (...allowed) => (req, res, next) => {
    if (!req.user || !req.user.roles) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const hasRole = req.user.roles.some((r) => allowed.includes(r));
    if (!hasRole) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    next();
};
