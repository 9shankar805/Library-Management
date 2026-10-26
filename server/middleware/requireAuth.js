import jwt from "jsonwebtoken";

/**
 * Requires a valid Bearer JWT and exposes its claims as req.auth and req.user.
 */
export const requireAuth = (req, res, next) => {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ success: false, message: "A valid Bearer token is required." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.auth = decoded;
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Your session is invalid or has expired. Please sign in again."
        });
    }
};

/**
 * Multi-Level Role-Based Access Control Middleware
 * Supports: ADMIN, LIBRARIAN, ASSISTANT, STUDENT
 */
export const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: "Access forbidden: No user role found in token."
            });
        }

        const userRole = req.user.role.toUpperCase();
        const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): [${allowedRoles.join(", ")}], but your role is ${req.user.role}.`
            });
        }

        return next();
    };
};

