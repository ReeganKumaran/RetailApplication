const User = require("../models/userModel");

async function listClients(req, res) {
  try {
    const customerId = req.user.customerId;
    const page = (req.query && req.query.page) || null;
    const limit = (req.query && req.query.limit) || null;
    const skip = (page - 1) * limit; // page = (1 - 1) = 0 * 1 = 0 mean skin 0 it will take from stating until limit
    if (!customerId) res.error("userID is missing please login again again");
    // const id = (req.query && req.query.id) || null;
    // if (id) {  
    // const client = await Client.findOne({ customerId });
    // if (!client) {
    // return res.error("Client not found", 404);
    // }
    // return res.success(client, "Client fetched successfully");
    // }
    const clients = await User.find({ customerId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    // const currectDate = new Date();
    // if (clients.returnDate) {
    //   client.total;
    // }
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
      itemDetail: itemDetailBody,
      item: legacyItemBody,
      deliveryDate,
      returnDate = null,
      email = null,
      aadhar = null,
      note = null,
      deliveryAddress = null,
      customerDetail,
    } = req.body;
    const itemDetail = itemDetailBody || legacyItemBody;
    const customerId = req.user.customerId;
    if (
      !clientName ||
      !itemDetail ||
      !itemDetail.name ||
      !itemDetail.size ||
      itemDetail.price === undefined ||
      itemDetail.price === null ||
      itemDetail.quantity === undefined ||
      itemDetail.quantity === null ||
      !deliveryDate
    ) {
      // console.log("Hello i am client post api")
      return res.error(
        "Payload must include clientName, itemDetail{name,size,price,quantity}, and deliveryDate",
        400
      );
    }

    const client = new User({
      customerId: customerId,
      clientName,
      // map API payload fields to schema field names
      clientPhoneNumber: phoneNumber,
      clientEmail: email,
      clientAadhaar: aadhar,
      notes: note,
      // item subdocument
      itemDetail,
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
    console.log("i am working well ra venna");
    const rawUpdate = req.body || {};
    const update = {};
    const id = (req.params && req.params.id) || (req.query && req.query.id);
    const customerId = req.user.customerId;
    if (!id) {
      return res.error("Missing client id (use /clients/:id or ?id=)", 400);
    }

    for (const [key, value] of Object.entries(rawUpdate)) {
      if (value === null || value === undefined) continue;
      if ((key === "itemDetail" || key === "item") && typeof value === "object" && value !== null) {
        // Flatten nested itemDetail updates to avoid overwriting the entire subdocument
        for (const [subKey, subVal] of Object.entries(value)) {
          if (subVal !== null && subVal !== undefined) {
            update[`itemDetail.${subKey}`] = subVal;
          }
        }
      } else {
        update[key] = value;
      }
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, customerId },
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
