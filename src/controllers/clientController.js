const Client = require("../models/clientsModel");

async function  listClients(req, res) {
  try {
    const userId = req.user.userId;
    const id = (req.query && req.query.id) || null;
    if (id) {
      const client = await Client.findOne({ _id: id, userId });
      if (!client) {
        return res.error("Client not found", 404);
      }
      return res.success(client, "Client fetched successfully");
    }
    const clients = await Client.find({ userId });
    return res.success(clients, "Clients fetched successfully");
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

async function addClient(req, res) {
  try {
    const {
      clientName,
      phoneNumber = null,
      item,
      deliveryDate,
      returnDate = null,
      email = null,
      aadhar = null,
      note = null,
      deliveryAddress = null,
      customerDetail,
    } = req.body;
    const userId = req.user.userId;
    if (
      !clientName ||
      !item ||
      !item.name ||
      !item.size ||
      (item.price === undefined || item.price === null) ||
      (item.quantity === undefined || item.quantity === null) ||
      !deliveryDate
    ) {
      // console.log("Hello i am client post api")
      return res.error(
        "Payload must include clientName, item{name,size,price,quantity}, and deliveryDate",
        400
      );
    }
    const client = new Client({
      userId,
      clientName,
      // map API payload fields to schema field names
      clientPhoneNumber: phoneNumber,
      clientEmail: email,
      clientAadhaar: aadhar,
      notes: note,
      // item subdocument
      item,
      deliveryDate,
      returnDate,
      // embedded docs
      deliveryAddress,
      customerDetail,
    });
    await client.save();
    return res.success({ id: client._id }, "Client added successfully", 201);
  } catch (error) {
    return res.error(error.message || "Something Went Wrong");
  }
}

async function editClient(req, res) {
  try {
    console.log("i am working well ra venna")
    const rawUpdate = req.body || {};
    const update = {};
    const id = (req.params && req.params.id) || (req.query && req.query.id);
    const userId = req.user.userId;
    if (!id) {
      return res.error("Missing client id (use /clients/:id or ?id=)", 400);
    }

    for (const [key, value] of Object.entries(rawUpdate)) {
      if (value === null || value === undefined) continue;
      if (key === "item" && typeof value === "object" && value !== null) {
        // Flatten nested item updates to avoid overwriting the entire subdocument
        for (const [subKey, subVal] of Object.entries(value)) {
          if (subVal !== null && subVal !== undefined) {
            update[`item.${subKey}`] = subVal;
          }
        }
      } else {
        update[key] = value;
      }
    }

    const updated = await Client.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    );
    if (!updated) {
      return res.error("Client not found", 404);
    }
    return res.success(updated, "Client updated successfully");
  } catch (error) {
    res.error(
      "Dei, enna API ezhuthirukka! Poraamai thappa thappa irukku." +
        error.message
    );
  }
}

module.exports = { listClients, addClient, editClient };
