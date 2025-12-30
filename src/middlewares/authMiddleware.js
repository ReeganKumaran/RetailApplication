const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Try to get token from multiple sources:
  // 1. Authorization header (Bearer token)
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  // 2. Query parameter (for GET requests with token in URL)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  // 3. Cookie (legacy support)
  if (!token && req.cookies["token"]) {
    token = req.cookies["token"];
  }

  if (!token) {
    return res.status(401).send("Unauthorized");
  }
  jwt.verify(token, process.env.JWT_SECRET || "default_secret", (err, decoded) => {
    if (err) {
      return res.status(403).send("Forbidden");
    }
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
