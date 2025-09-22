const Owner = require("../models/ownerModel");
const mongoose = require("mongoose");

async function getListItem(req, res) {
  try {
    const ownerId = req.user.userId;
    if (!ownerId) res.error("UserId is missing");
    const itemList = await Owner.findById(ownerId);
    if (!itemList) res.error("UserId is missing");
    res.success(itemList.items);
  } catch (error) {
    res.error(error.message || "Something went wrong");
  }
}

async function addItem(req, res) {
  try {
    const payload = req.body;
    if (!payload.itemName) res.error("Items detail is missing");
    const ownerId = req.user.userId;
    const itemsList = await Owner.findById(ownerId);
    if (!itemsList) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!itemsList) res.error("User ID is mission");

    itemsList.items.push({
      itemName: payload.itemName,
      quantity: payload.quantity,
    });
    // console.log(itemsList.items);
    await itemsList.save();
    res.success(itemsList);
  } catch (error) {
    res.error(error.message);
  }
}

async function updateItem(req, res) {
  try {
    const ownerId = req.user.userId;
    const itemId =
      (req.params && req.params.id) || (req.query && req.query.id) || null;
    const { itemName, quantity } = req.body;
    const missingFields = [];
    if (!itemName) missingFields.push("itemName");
    if (!quantity) missingFields.push("quantity");
    if (!ownerId) missingFields.push("ownerId");
    if (!itemId) missingFields.push("itemId");
    if (missingFields.length > 0)
      res.error(`Missing required field(s): ${missingFields.join(", ")}`);
    const result = await Owner.findOneAndUpdate(
      { _id: ownerId, "items._id": itemId },
      {
        $set: {
          "items.$.itemName": itemName,
          "items.$.quantity": quantity,
        },
      }
    );
    res.success(result);
  } catch (error) {
    res.error(error.message);
  }
}

async function deleteItem(req, res) {
  try {
    const ownerId = req.user.userId;
    const itemId =
      (req.query && req.query.id) || (req.params && req.params.id) || null;
    if (!itemId) res.error("The Item ID is require");
    const updatedOwner = await Owner.findOneAndUpdate(
      { _id: ownerId },
      { $pull: { items: { _id: itemId } } },
      { new: true }
    );
    res.success({
      message: "Item deleted successfully",
      items: updatedOwner.items,
    });
  } catch (error) {
    res.error(error.message || "Something went wrong");
  }
}
module.exports = { addItem, deleteItem, getListItem, updateItem };
