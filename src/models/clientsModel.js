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

  // order details
  itemName: {
    type: String,
    required: true,
  },
  itemSize: {
    type: String,
    required: true,
  },
  itemPrice: {
    type: Number,
    required: true,
  },
  itemQuantity: {
    type: Number,
    required: true,   
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
  updateAt: {
    type: Date,
    default: Date.now,
  },
});
const Client = mongoose.model("Clients", clientsModel);
module.exports = Client;
