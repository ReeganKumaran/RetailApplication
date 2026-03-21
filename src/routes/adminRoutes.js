const express = require("express");
const router = express.Router();
const { createAdmin, adminLogin } = require("../controllers/adminController");

router.post("/admin/create", createAdmin);
router.post("/admin/login", adminLogin);

module.exports = router;    