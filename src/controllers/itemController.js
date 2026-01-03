const Item = require("../models/itemModel");
const Owner = require("../models/ownerModel");

// Create a new item
async function createItem(req, res) {
  try {
    const ownerId = req.user.userId;
    const {
      name,
      inventory,
      pricing,
      dimensions,
    } = req.body;

    if (!ownerId) {
      return res.error(
        "Authentication error: userId is missing. Please login again.",
        401
      );
    }

    // Verify that the authenticated user (business owner) exists
    const businessOwner = await Owner.findById(ownerId);
    if (!businessOwner) {
      return res.error(
        "Invalid user: Business owner account not found. Please login again.",
        401
      );
    }

    // Validate required fields
    if (!name) {
      return res.error("Item name is required", 400);
    }

    if (!inventory || inventory.totalQuantity === undefined || inventory.availableQuantity === undefined) {
      return res.error(
        "Inventory details (totalQuantity and availableQuantity) are required",
        400
      );
    }

    if (!pricing || pricing.unitPrice === undefined) {
      return res.error("Pricing details (unitPrice) are required", 400);
    }

    // Create new item (itemId will auto-increment)
    const item = new Item({
      ownerId,
      name,
      inventory: {
        totalQuantity: inventory.totalQuantity,
        availableQuantity: inventory.availableQuantity,
      },
      pricing: {
        unitPrice: pricing.unitPrice,
        currency: pricing.currency || "INR",
      },
      dimensions: dimensions || {},
    });

    await item.save();
    return res.success({ item }, "Item created successfully", 201);
  } catch (error) {
    if (error.code === 11000) {
      return res.error("Item with this itemId already exists", 409);
    }
    return res.error(error.message || "Something went wrong", 500);
  }
}

// Get all items for the authenticated owner
async function getAllItems(req, res) {
  try {
    const ownerId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || null;
    const search = req.query.search || null;
    const skip = limit ? (page - 1) * limit : 0;

    if (!ownerId) {
      return res.error(
        "Authentication error: userId is missing. Please login again.",
        401
      );
    }

    // Build query
    const query = { ownerId };

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { itemId: searchRegex },
      ];
    }

    const items = await Item.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCount = await Item.countDocuments(query);

    const response = {
      items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: limit ? Math.ceil(totalCount / limit) : 1,
      },
    };

    return res.success(response, "Items fetched successfully");
  } catch (error) {
    return res.error(error.message || "Something went wrong", 500);
  }
}

// Get a single item by ID
async function getItemById(req, res) {
  try {
    const ownerId = req.user.userId;
    const itemId = req.params.id || req.query.id;

    if (!ownerId) {
      return res.error(
        "Authentication error: userId is missing. Please login again.",
        401
      );
    }

    if (!itemId) {
      return res.error("Item ID is required", 400);
    }

    const item = await Item.findOne({ _id: itemId, ownerId });

    if (!item) {
      return res.error("Item not found or does not belong to your account", 404);
    }

    return res.success({ item }, "Item fetched successfully");
  } catch (error) {
    return res.error(error.message || "Something went wrong", 500);
  }
}

// Update an item
async function updateItem(req, res) {
  try {
    const ownerId = req.user.userId;
    const itemId = req.params.id || req.query.id;
    const updates = req.body;

    if (!ownerId) {
      return res.error(
        "Authentication error: userId is missing. Please login again.",
        401
      );
    }

    if (!itemId) {
      return res.error("Item ID is required", 400);
    }

    // Build update object
    const update = {};
    if (updates.name !== undefined) update.name = updates.name;
    // itemId is auto-generated and should not be updated manually

    // Handle nested inventory updates
    if (updates.inventory) {
      if (updates.inventory.totalQuantity !== undefined) {
        update["inventory.totalQuantity"] = updates.inventory.totalQuantity;
      }
      if (updates.inventory.availableQuantity !== undefined) {
        update["inventory.availableQuantity"] = updates.inventory.availableQuantity;
      }
    }

    // Handle nested pricing updates
    if (updates.pricing) {
      if (updates.pricing.unitPrice !== undefined) {
        update["pricing.unitPrice"] = updates.pricing.unitPrice;
      }
      if (updates.pricing.currency !== undefined) {
        update["pricing.currency"] = updates.pricing.currency;
      }
    }

    // Handle nested dimensions updates
    if (updates.dimensions) {
      if (updates.dimensions.width !== undefined) {
        update["dimensions.width"] = updates.dimensions.width;
      }
      if (updates.dimensions.height !== undefined) {
        update["dimensions.height"] = updates.dimensions.height;
      }
      if (updates.dimensions.unit !== undefined) {
        update["dimensions.unit"] = updates.dimensions.unit;
      }
    }

    const item = await Item.findOneAndUpdate(
      { _id: itemId, ownerId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.error("Item not found or does not belong to your account", 404);
    }

    return res.success({ item }, "Item updated successfully");
  } catch (error) {
    if (error.code === 11000) {
      return res.error("Item with this itemId already exists", 409);
    }
    return res.error(error.message || "Something went wrong", 500);
  }
}

// Delete an item
async function deleteItem(req, res) {
  try {
    const ownerId = req.user.userId;
    const itemId = req.params.id || req.query.id;

    if (!ownerId) {
      return res.error(
        "Authentication error: userId is missing. Please login again.",
        401
      );
    }

    if (!itemId) {
      return res.error("Item ID is required", 400);
    }

    const item = await Item.findOneAndDelete({ _id: itemId, ownerId });

    if (!item) {
      return res.error("Item not found or does not belong to your account", 404);
    }

    return res.success({ id: itemId }, "Item deleted successfully");
  } catch (error) {
    return res.error(error.message || "Something went wrong", 500);
  }
}

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};
