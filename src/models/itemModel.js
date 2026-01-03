const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { Schema } = mongoose;

const ItemSchema = new Schema(
  {
    itemId: {
      type: Number,
      unique: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    inventory: {
      totalQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      availableQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },
    pricing: {
      unitPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "INR",
        enum: ["INR", "USD", "EUR", "GBP"],
      },
    },
    dimensions: {
      width: {
        type: Number,
        min: 0,
      },
      height: {
        type: Number,
        min: 0,
      },
      unit: {
        type: String,
        enum: ["cm", "m", "inch", "ft"],
        default: "ft",
      },
    },
  },
  { timestamps: true }
);

// Add auto-increment plugin for itemId
ItemSchema.plugin(AutoIncrement, {
  inc_field: "itemId",
  start_seq: 1,
});

// Validate that availableQuantity doesn't exceed totalQuantity
ItemSchema.pre("save", function (next) {
  if (this.inventory.availableQuantity > this.inventory.totalQuantity) {
    return next(
      new Error("Available quantity cannot exceed total quantity")
    );
  }
  next();
});

ItemSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const set = update.$set || update;

  // Validate inventory quantities if they're being updated
  if (set["inventory.availableQuantity"] !== undefined && set["inventory.totalQuantity"] !== undefined) {
    if (set["inventory.availableQuantity"] > set["inventory.totalQuantity"]) {
      return next(
        new Error("Available quantity cannot exceed total quantity")
      );
    }
  } else if (set["inventory.availableQuantity"] !== undefined) {
    // If only available quantity is being updated, check against existing total
    const doc = await this.model.findOne(this.getQuery());
    if (doc && set["inventory.availableQuantity"] > doc.inventory.totalQuantity) {
      return next(
        new Error("Available quantity cannot exceed total quantity")
      );
    }
  }

  next();
});

const Item = mongoose.model("Item", ItemSchema);
module.exports = Item;
