const Client = require("../models/clientsModel");

async function listClients(req, res) {
  try {
    const userId = req.user.userId;
    const clients = await Client.find({ userId });
    return res.success(clients, "Clients fetched successfully");
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

async function addClient(req, res) {
  try {
    const { username, phoneNumber } = req.body;
    const userId = req.user.userId;
    if (!username || !phoneNumber) {
      return res.error(
        "The payload must include both username and phoneNumber",
        400
      );
    }
    const client = new Client({ userId, username, phoneNumber });
    await client.save();
    return res.success({ id: client._id }, "Client added successfully", 201);
  } catch (error) {
    return res.error(error.message || "Something Went Wrong");
  }
}

module.exports = { listClients, addClient };

