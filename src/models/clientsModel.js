const mongoose = require("mongoose");
const addressSchema = require("./addressModel"); // exports schema
const customerDetail = require("./customerModel");
const { Schema } = mongoose;

const clientsModel = new Schema({
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
    // required: true,
  },
  clientEmail: {
    type: String,
  },
  clientAadhaar: {
    type: String,
  },
  item: {
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
    type: Boolean,
    default: false,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
const Client = mongoose.model("Clients", clientsModel);
module.exports = Client;
