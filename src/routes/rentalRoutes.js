const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  listRentals,
  addRental,
  editRental,
  deleteRental,
  listAllCustomers,
  deleteCustomer,
} = require("../controllers/rentalController");
const { generateInvoicePDF, previewInvoice } = require("../controllers/pdfController");

const rentalRouter = express.Router();

rentalRouter.use(authMiddleware);

// Rental routes
rentalRouter.get("/rentals", listRentals);
rentalRouter.get("/rentals/:customerId", listRentals);  // Get specific rental by ID
rentalRouter.post("/rentals", addRental);
// Support updating by id path param and legacy query param (?id=...)
rentalRouter.patch("/rentals/:customerId", editRental);
rentalRouter.patch("/rentals", editRental);
// Delete rental routes
rentalRouter.delete("/rentals/:customerId", deleteRental);
rentalRouter.delete("/rentals", deleteRental);

// Customer routes
rentalRouter.get("/customers", listAllCustomers);
rentalRouter.delete("/customers/:id", deleteCustomer);
rentalRouter.delete("/customers", deleteCustomer);

// PDF Generation routes
rentalRouter.get("/generate-invoice-pdf", generateInvoicePDF);
rentalRouter.get("/preview-invoice", previewInvoice);

module.exports = rentalRouter;
