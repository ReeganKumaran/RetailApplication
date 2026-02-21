const jwt = require("jsonwebtoken");

const isAdmin = (req, res, next) => {
    // Try to get token from multiple sources:
    // 1. Authorization header (Bearer token)
    const authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];

    // 2. Query parameter
    if (!token && req.query.token) {
        token = req.query.token;
    }

    // 3. Cookie
    if (!token && req.cookies && req.cookies["token"]) {
        token = req.cookies["token"];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided"
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || "default_secret", (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Invalid token"
            });
        }

        // Check if the user has the ADMIN role
        // Note: the token payload in adminController.js uses 'userRole'
        if (decoded.userRole !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admin role required"
            });
        }

        req.user = decoded;
        next();
    });
};

module.exports = { isAdmin };
