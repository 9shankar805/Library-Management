import helmet from "helmet";
import rateLimit from "express-rate-limit";

/**
 * Helmet HTTP Header Protection
 */
export const helmetMiddleware = helmet({
    contentSecurityPolicy: false, // Allows cross-origin API and dashboard assets
    crossOriginEmbedderPolicy: false
});

/**
 * Rate Limiter for Authentication Endpoints (Brute-force protection)
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Limit each IP to 60 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts from this IP. Please try again after 15 minutes."
    }
});

/**
 * General API Rate Limiter
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests submitted. Rate limit exceeded, please slow down."
    }
});

/**
 * Recursive Input Sanitizer (XSS and script injection defense)
 */
const sanitizeValue = (val) => {
    if (typeof val === "string") {
        // Strip out dangerous tags and script patterns
        return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                  .replace(/javascript:/gi, "")
                  .replace(/on\w+\s*=/gi, "");
    }
    if (typeof val === "object" && val !== null) {
        Object.keys(val).forEach((key) => {
            val[key] = sanitizeValue(val[key]);
        });
    }
    return val;
};

const sanitizeObjectInPlace = (obj) => {
    if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === "string") {
                obj[key] = sanitizeValue(obj[key]);
            } else if (typeof obj[key] === "object" && obj[key] !== null) {
                sanitizeObjectInPlace(obj[key]);
            }
        }
    }
};

export const sanitizeInputs = (req, res, next) => {
    if (req.body) sanitizeObjectInPlace(req.body);
    if (req.query) sanitizeObjectInPlace(req.query);
    if (req.params) sanitizeObjectInPlace(req.params);
    next();
};

/**
 * Production-Safe Centralized Error Handler
 * Suppresses internal stack traces from leaking to client
 */
export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
    console.error(`[Security Log] Unhandled Error [${req.method} ${req.url}]:`, err.message);

    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "An unexpected internal server error occurred. Our team has been notified."
            : err.message || "Internal Server Error"
    });
};
