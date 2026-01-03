const express = require("express");
const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Apply authentication middleware to all item routes
router.use(authMiddleware);

// Create a new item
router.post("/items", createItem);

// Get all items (with optional pagination and search)
router.get("/items", getAllItems);

// Get a single item by ID
router.get("/items/:id", getItemById);

// Update an item by ID
router.put("/items/:id", updateItem);
router.patch("/items/:id", updateItem);

// Delete an item by ID
router.delete("/items/:id", deleteItem);

module.exports = router;
