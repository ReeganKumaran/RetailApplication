const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.cookies["token"];
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
