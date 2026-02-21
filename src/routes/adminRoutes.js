const express = require("express");
const router = express.Router();
const { createAdmin, adminLogin } = require("../controllers/adminController");
const { isAdmin } = require("../middlewares/isAdmin");

router.post("/admin/create", isAdmin, createAdmin);
router.post("/admin/login", isAdmin, adminLogin);

module.exports = router;    