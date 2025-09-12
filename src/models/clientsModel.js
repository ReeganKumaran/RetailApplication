const mongoose = require("mongoose");
const addressSchema = require("./addressModel"); // exports schema
const customerDetail = require("./customerModel");
const { Schema } = mongoose;

const clientsModel = new Schema(
  {
    // client details
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientPhoneNumber: {
      type: String,
    },
    clientEmail: {
      type: String,
    },
    clientAadhaar: {
      type: String,
    },
    itemDetail: {
      name: {
        type: String,
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
    retalStatus: {
      type: String,
      enum: ["Pending", "Returned"],
      default: "Pending",
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    // relations and address details
    customerDetail,
    deliveryAddress: addressSchema,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtuals: compute totalDays and itemDetail.totalPrice on read

clientsModel.virtual("totalDays").get(function () {
  if (!this.deliveryDate) return undefined;
  const end = this.returnDate ? new Date(this.returnDate) : new Date();
  const start = new Date(this.deliveryDate);
  const diffMs = end - start;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
});

clientsModel.virtual("itemDetail.totalPrice").get(function () {
  const price =
    this.itemDetail && typeof this.itemDetail.price === "number"
      ? this.itemDetail.price
      : 0;
  const qty =
    this.itemDetail && typeof this.itemDetail.quantity === "number"
      ? this.itemDetail.quantity
      : 0;
  if (!this.deliveryDate) return 0;
  const end = this.returnDate ? new Date(this.returnDate) : new Date();
  const start = new Date(this.deliveryDate);
  const diffMs = end - start;
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return price * qty * (Number.isFinite(days) ? days : 0);
});

// Validation only (no stored totalDays)
clientsModel.pre("save", function (next) {
  try {
    if (this.deliveryDate && this.returnDate) {
      const start = new Date(this.deliveryDate);
      const end = new Date(this.returnDate);
      if (end < start) {
        return next(
          new Error("Return date must be later than or equal to delivery date.")
        );
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

clientsModel.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() || {};
    const set = update.$set || update;
    const doc = await this.model.findOne(this.getQuery());
    const d = doc && doc.deliveryDate ? new Date(doc.deliveryDate) : null;
    if (set.returnDate && d) {
      const r = new Date(set.returnDate);
      if (r < d) {
        return next(
          new Error("Return date must be later than or equal to delivery date.")
        );
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Client = mongoose.model("Clients", clientsModel);
module.exports = Client;
