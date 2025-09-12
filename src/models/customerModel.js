const mongoose = require("mongoose");
const addressSchema = require("./addressModel");

const customerSchema = new mongoose.Schema({
  customerName: {
    type: String,
  },
  customerAadhar: {
    type: String,
  },
  customerPhone: {
    type: String,
  },
  customerEmail: {
    type: String,
  },
  customerAddress: addressSchema,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the schema for embedding in other documents
module.exports = customerSchema;
