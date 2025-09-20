const express = require("express");
const {
  addItem,
  deleteItem,
  getListItem,
  updateItem,
} = require("../controllers/itemController");
const router = express.Router();

// get item list 
router.get("/item", getListItem);

// add item 
router.post("/item", addItem);

// update item by id
router.patch("/item", updateItem);
router.patch("/item/:id", updateItem);

// delete item by id
router.delete("/item/:id", deleteItem);
router.delete("/item", deleteItem);

module.exports = router;