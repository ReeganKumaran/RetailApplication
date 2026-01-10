const express = require("express");
const {
  createItem,
  getAllItems,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Apply authentication middleware to all item routes
router.use(authMiddleware);

// Create a new item
router.post("/items", createItem);

// Get all items (with optional pagination and search, or single item by ?id=...)
router.get("/items", getAllItems);

// Update an item by ID (query parameter)
router.put("/items", updateItem);
router.patch("/items", updateItem);

// Delete an item by ID (query parameter)
router.delete("/items", deleteItem);

module.exports = router;
