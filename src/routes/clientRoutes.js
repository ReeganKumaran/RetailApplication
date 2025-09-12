const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  listClients,
  addClient,
  editClient,
} = require("../controllers/clientController");

const router = express.Router();

router.use(authMiddleware);
router.get("/clients", listClients);
router.post("/clients", addClient);
// Support updating by id path param and legacy query param (?id=...)
router.patch("/clients/:id", editClient);
router.patch("/clients", editClient);

module.exports = router;
