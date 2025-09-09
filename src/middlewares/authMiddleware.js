const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // let token = "";
  // if(req.cookies[token]){
  //   token = 
  // }  
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // const token = req.cookies["token"];

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
