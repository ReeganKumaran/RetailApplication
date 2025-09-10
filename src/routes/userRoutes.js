const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { listUsers } = require("../controllers/userController");

const router = express.Router();

router.use(authMiddleware);
router.get("/allUser", listUsers);

module.exports = router;

