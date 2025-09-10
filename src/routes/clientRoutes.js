const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { listClients, addClient } = require("../controllers/clientController");

const router = express.Router();

router.use(authMiddleware);
router.get("/clients", listClients);
router.post("/clients", addClient);

module.exports = router;

