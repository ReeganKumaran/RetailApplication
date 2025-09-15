const Rental = require("../models/rentalModel");
const CustomerCollection = require("../models/customerCollectionModel");
const Owner = require("../models/ownerModel");

async function listRentals(req, res) {
  try {
    const businessOwnerId = req.user.userId;
    const clientId = (req.query && req.query.id) || (req.params && req.params.id) || null;
    const page = parseInt(req.query && req.query.page) || 1;
    const limit = parseInt(req.query && req.query.limit) || null;
    const skip = limit ? (page - 1) * limit : 0;

    if (!businessOwnerId) return res.error("userID is missing please login again", 401);

    // Verify that the authenticated user exists
    const businessOwner = await Owner.findById(businessOwnerId);
    if (!businessOwner) {
      return res.error("Invalid user: Business owner account not found. Please login again.", 401);
    }

    // Build query - always filter by business owner
    const query = { ownerId: businessOwnerId };

    // If a specific client ID is provided, filter rentals for that customer
    if (clientId) {
      // First verify this customer belongs to this business owner
      const customer = await CustomerCollection.findOne({
        _id: clientId,
        ownerId: businessOwnerId
      });

      if (!customer) {
        return res.error("Customer not found or does not belong to your business", 404);
      }

      // Find all rentals for this specific customer by customerId
      query.customerId = clientId;
    }

    const rentals = await Rental.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const totalCount = await Rental.countDocuments(query);

    // If filtering by client, also return customer info
    const response = {
      rentals,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount,
        totalPages: limit ? Math.ceil(totalCount / limit) : 1
      }
    };

    if (clientId) {
      const customer = await CustomerCollection.findById(clientId);
      response.customer = customer;
    }

    return res.success(response, "Rentals fetched successfully");
  } catch (error) {
    console.error("Error fetching rentals:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

async function addRental(req, res) {
  try {
    const {
      customer: customerName,
      phoneNumber = null,
      itemDetail: itemDetailBody,
      item: legacyItemBody,
      deliveryDate,
      returnDate = null,
      email = null,
      aadhar = null,
      note = null,
      deliveryAddress = null,
      customerDetail = null,  // New field for customer details
    } = req.body;
    const itemDetail = itemDetailBody || legacyItemBody;
    const customerId = req.user.userId;

    if (!customerId) {
      return res.error("Authentication error: userId is missing. Please login again.", 401);
    }

    // Verify that the authenticated user (business owner) exists
    const businessOwner = await Owner.findById(customerId);
    if (!businessOwner) {
      return res.error("Invalid user: Business owner account not found. Please login again.", 401);
    }

    if (
      !customerName ||
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
        "Payload must include customer, itemDetail{name,size,price,quantity}, and deliveryDate",
        400
      );
    }

    // Create/Update customer record
    // Find customer by phone number and business owner's customerId
    let customer = await CustomerCollection.findOne({
      ownerId: customerId,
      phoneNumber: phoneNumber
    });

    if (!customer) {
      // Create new customer
      customer = new CustomerCollection({
        ownerId: customerId,
        customerName: customerName,
        phoneNumber: phoneNumber || "",
        email: email || "",
        aadharNumber: aadhar || "",
        address: deliveryAddress ? [deliveryAddress] : [],
        totalRented: 1,
        totalDelivered: deliveryDate ? 1 : 0,  // If deliveryDate exists, count as delivered
        totalReturned: returnDate ? 1 : 0,     // If returnDate exists, count as returned
        activeRentals: returnDate ? 0 : 1,     // If returned, no active rentals, else 1
        lastRentalDate: new Date(),
      });
    } else {
      // Update existing customer
      customer.totalRented += 1;
      customer.lastRentalDate = new Date();

      // Update delivery count if deliveryDate is present
      if (deliveryDate) {
        customer.totalDelivered += 1;
      }

      // Update return count if returnDate is present
      if (returnDate) {
        customer.totalReturned += 1;
        // Don't increment activeRentals if already returned
      } else {
        // Only increment activeRentals if not returned
        customer.activeRentals += 1;
      }

      // Update contact info if provided
      if (phoneNumber) customer.phoneNumber = phoneNumber;
      if (email) customer.email = email;
      if (aadhar) customer.aadharNumber = aadhar;

      // Add new address if provided and not already exists
      if (deliveryAddress) {
        const addressExists = customer.address.some(addr =>
          addr.street === deliveryAddress.street &&
          addr.city === deliveryAddress.city
        );
        if (!addressExists) {
          customer.address.push(deliveryAddress);
        }
      }
    }

    await customer.save();

    const rental = new Rental({
      ownerId: customerId,
      customerId: customer._id,  // Add the customer's ID reference
      customer: customerName,
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
      // Add customerDetail if provided in the request
      customerDetail: customerDetail || undefined,
    });
    await rental.save();
    return res.success({ id: rental._id }, "Rental added successfully", 201);
  } catch (error) {
    return res.error(error.message || "Something Went Wrong");
  }
}

async function editRental(req, res) {
  try {
    console.log("i am working well ra venna");
    const rawUpdate = req.body || {};
    const update = {};
    const id = (req.params && req.params.id) || (req.query && req.query.id);
    const customerId = req.user.userId;

    if (!customerId) {
      return res.error("Authentication error: userId is missing. Please login again.", 401);
    }

    // Verify that the authenticated user exists
    const businessOwner = await Owner.findById(customerId);
    if (!businessOwner) {
      return res.error("Invalid user: Business owner account not found. Please login again.", 401);
    }

    if (!id) {
      return res.error("Missing rental id (use /rentals/:id or ?id=)", 400);
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
      } else if (key === "customerDetail" && typeof value === "object" && value !== null) {
        // Flatten nested customerDetail updates to avoid overwriting the entire subdocument
        for (const [subKey, subVal] of Object.entries(value)) {
          if (subVal !== null && subVal !== undefined) {
            update[`customerDetail.${subKey}`] = subVal;
          }
        }
      } else {
        update[key] = value;
      }
    }

    // Get the original document to track status changes
    const originalRental = await Rental.findOne({ _id: id, ownerId: customerId });
    if (!originalRental) {
      return res.error("Rental not found", 404);
    }

    const updated = await Rental.findOneAndUpdate(
      { _id: id, ownerId: customerId },
      { $set: update },
      { new: true }
    );

    // Handle phone number changes and update customer statistics
    let customer = await CustomerCollection.findOne({
      ownerId: customerId,
      phoneNumber: originalRental.clientPhoneNumber
    });

    // If phone number is being changed, handle the customer record migration
    if (update.clientPhoneNumber && update.clientPhoneNumber !== originalRental.clientPhoneNumber) {
      const newPhoneNumber = update.clientPhoneNumber;

      // Check if a customer with the new phone number already exists
      let newCustomer = await CustomerCollection.findOne({
        ownerId: customerId,
        phoneNumber: newPhoneNumber
      });

      if (newCustomer) {
        // Merge with existing customer record for the new phone number
        newCustomer.totalRented += 1;
        newCustomer.lastRentalDate = new Date();

        // Decrease counts from old customer if exists
        if (customer) {
          customer.activeRentals = Math.max(0, customer.activeRentals - 1);
          await customer.save();
        }

        // Increase active rentals for new customer
        if (!originalRental.returnDate) {
          newCustomer.activeRentals += 1;
        }

        customer = newCustomer; // Use the new customer record for further updates
        // Update the rental's customerId to point to the new customer
        update.customerId = newCustomer._id;
      } else if (customer) {
        // Update the existing customer record with new phone number
        customer.phoneNumber = newPhoneNumber;

        // Update other contact info if provided
        if (update.clientEmail) customer.email = update.clientEmail;
        if (update.clientAadhaar) customer.aadharNumber = update.clientAadhaar;
      } else {
        // Create a new customer record if none exists (edge case)
        customer = new CustomerCollection({
          ownerId: customerId,
          customerName: updated.customer,
          phoneNumber: newPhoneNumber,
          email: update.clientEmail || "",
          aadharNumber: update.clientAadhaar || "",
          address: [],
          totalRented: 1,
          totalDelivered: originalRental.deliveryDate ? 1 : 0,
          totalReturned: originalRental.returnDate ? 1 : 0,
          activeRentals: originalRental.returnDate ? 0 : 1,
          lastRentalDate: new Date(),
        });
      }

      // Set the customerId in the update
      if (customer && customer._id) {
        update.customerId = customer._id;
      }
    }

    if (customer) {
      let needsSave = false;

      // Track delivery status - if deliveryDate is newly set
      if (update.deliveryDate && !originalRental.deliveryDate) {
        customer.totalDelivered += 1;
        needsSave = true;
      }

      // Track return status - if returnDate is newly set
      if (update.returnDate && !originalRental.returnDate) {
        customer.totalReturned += 1;
        customer.activeRentals = Math.max(0, customer.activeRentals - 1);
        needsSave = true;
      }

      // Also check retalStatus for backward compatibility
      if (update.retalStatus && update.retalStatus !== originalRental.retalStatus) {
        if (update.retalStatus === "Returned" && originalRental.retalStatus !== "Returned") {
          // Only increment if returnDate wasn't already handling this
          if (!update.returnDate && !originalRental.returnDate) {
            customer.totalReturned += 1;
            customer.activeRentals = Math.max(0, customer.activeRentals - 1);
            needsSave = true;
          }
        }
      }

      // Update other customer details if changed
      if (update.customer && update.customer !== originalRental.customer) {
        customer.customerName = update.customer;
        needsSave = true;
      }

      if (update.clientEmail && update.clientEmail !== originalRental.clientEmail) {
        customer.email = update.clientEmail;
        needsSave = true;
      }

      if (update.clientAadhaar && update.clientAadhaar !== originalRental.clientAadhaar) {
        customer.aadharNumber = update.clientAadhaar;
        needsSave = true;
      }

      if (needsSave || update.clientPhoneNumber) {
        await customer.save();
      }
    }

    return res.success(updated, "Rental updated successfully");
  } catch (error) {
    res.error(
      "Dei, enna API ezhuthirukka! Poraamai thappa thappa irukku." +
        error.message
    );
  }
}

async function listAllCustomers(req, res) {
  try {
    const customerId = req.user.userId;
    const customers = await CustomerCollection.find({ ownerId: customerId })
      .sort({ lastRentalDate: -1 });
    return res.success(customers, "Customers fetched successfully");
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

async function getCustomerStats(req, res) {
  try {
    const customerId = req.user.userId;
    const customerStats = await CustomerCollection.findOne({ ownerId: customerId });
    if (!customerStats) {
      return res.error("Customer not found", 404);
    }
    return res.success(customerStats, "Customer statistics fetched successfully");
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

async function deleteRental(req, res) {
  try {
    const id = (req.params && req.params.id) || (req.query && req.query.id);
    const ownerId = req.user.userId;

    if (!ownerId) {
      return res.error("Authentication error: userId is missing. Please login again.", 401);
    }

    if (!id) {
      return res.error("Missing rental id (use /rentals/:id or ?id=)", 400);
    }

    // Find the rental first to get customer info for updating statistics
    const rental = await Rental.findOne({ _id: id, ownerId });

    if (!rental) {
      return res.error("Rental not found or does not belong to your business", 404);
    }

    // Update customer statistics if customer exists
    if (rental.customerId) {
      const customer = await CustomerCollection.findById(rental.customerId);

      if (customer) {
        // Decrease rental counts
        customer.totalRented = Math.max(0, customer.totalRented - 1);

        // If rental was not returned, decrease active rentals
        if (!rental.returnDate) {
          customer.activeRentals = Math.max(0, customer.activeRentals - 1);
        } else {
          // If rental was returned, decrease returned count
          customer.totalReturned = Math.max(0, customer.totalReturned - 1);
        }

        // If rental was delivered, decrease delivered count
        if (rental.deliveryDate) {
          customer.totalDelivered = Math.max(0, customer.totalDelivered - 1);
        }

        await customer.save();
      }
    }

    // Delete the rental
    await Rental.findByIdAndDelete(id);

    return res.success({ id }, "Rental deleted successfully");
  } catch (error) {
    console.error("Error deleting rental:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

async function deleteCustomer(req, res) {
  try {
    const customerId = (req.params && req.params.id) || (req.query && req.query.id);
    const ownerId = req.user.userId;

    if (!ownerId) {
      return res.error("Authentication error: userId is missing. Please login again.", 401);
    }

    if (!customerId) {
      return res.error("Missing customer id (use /customers/:id or ?id=)", 400);
    }

    // Verify that the customer belongs to this business owner
    const customer = await CustomerCollection.findOne({
      _id: customerId,
      ownerId: ownerId
    });

    if (!customer) {
      return res.error("Customer not found or does not belong to your business", 404);
    }

    // Delete all rentals associated with this customer
    const deleteResult = await Rental.deleteMany({
      customerId: customerId,
      ownerId: ownerId
    });

    // Delete the customer
    await CustomerCollection.findByIdAndDelete(customerId);

    return res.success(
      {
        customerId,
        rentalsDeleted: deleteResult.deletedCount
      },
      `Customer and ${deleteResult.deletedCount} associated rentals deleted successfully`
    );
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

module.exports = {
  listRentals,
  addRental,
  editRental,
  deleteRental,
  listAllCustomers,
  getCustomerStats,
  deleteCustomer
};
