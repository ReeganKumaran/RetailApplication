const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      default: "no street",
      //   required: true,
      trim: true,
    },
    city: {
      type: String,
      default: "no city",
      //   required: true,
      trim: true, 
    },
    state: {
      type: String,
      default: "no state",
      //   required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      default: "no postalCode",
      //   required: true,
      match: /^[0-9]{5,6}$/, // optional: validates Indian 6-digit PIN or 5-digit ZIP
    },
    country: {
      type: String,
      default: "India", // default country
      trim: true,
    },
    landmark: {
      type: String,
      default: "no landmark",
      //   trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Export the schema for embedding in other documents
module.exports = addressSchema;
