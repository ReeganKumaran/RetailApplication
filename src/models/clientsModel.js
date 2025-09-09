const mongoose = require("mongoose");
const {Schema} = mongoose;

const clientsModel = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    }
})
const Client = mongoose.model("Clients", clientsModel)
module.exports = Client;
