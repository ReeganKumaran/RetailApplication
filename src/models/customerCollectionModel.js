const mongoose = require("mongoose");
const addressSchema = require("./addressModel");
const { Schema } = mongoose;

const customerCollectionSchema = new Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    aadharNumber: {
      type: String,
    },
    address: [addressSchema],
    // Rental statistics
    totalRented: {
      type: Number,
      default: 0,
    },
    totalReturned: {
      type: Number,
      default: 0,
    },
    totalDelivered: {
      type: Number,
      default: 0,
    },
    // Track active rentals
    activeRentals: {
      type: Number,
      default: 0,
    },
    // Last rental date
    lastRentalDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
customerCollectionSchema.index({ ownerId: 1 });
customerCollectionSchema.index({ phoneNumber: 1 });
customerCollectionSchema.index({ email: 1 });

const CustomerCollection = mongoose.model("CustomerCollection", customerCollectionSchema);
module.exports = CustomerCollection;