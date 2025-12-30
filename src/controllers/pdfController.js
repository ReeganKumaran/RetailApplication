const puppeteer = require("puppeteer");
const Rental = require("../models/rentalModel");

const dateFormatter = (data) => {
  if (!data || data === "-") return "";
  try {
    const date = new Date(data);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  } catch (err) {
    console.error(err);
    return "";
  }
};

async function generateInvoicePDF(req, res) {
  let browser = null;

  try {
    // Support both GET (query params) and POST (body)
    let rentalIds = req.body?.rentalIds || req.query.rentalIds;

    // If rentalIds is a string, convert it to an array
    if (typeof rentalIds === 'string') {
      rentalIds = [rentalIds];
    }

    const ownerId = req.user.userId;

    if (!rentalIds || !Array.isArray(rentalIds) || rentalIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rentalIds array is required (either in body or query params)",
      });
    }

    // Fetch all rentals
    const rentals = await Rental.find({
      _id: { $in: rentalIds },
      ownerId: ownerId,
    });

    if (!rentals || rentals.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No rentals found for the provided IDs",
      });
    }

    // Generate HTML for the invoice
    const invoiceHTML = generateInvoiceHTML(rentals);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(invoiceHTML, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });

    await browser.close();
    browser = null;

    // Set headers for PDF download
    const filename = `invoice_${rentals[0]._id}_${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);

    // Close browser if it's still open
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error.message,
    });
  }
}

function generateInvoiceHTML(rentals) {
  const firstRental = rentals[0];
  const closedRentals = rentals.filter((r) => r.rentalStatus === "Returned");

  // Calculate total for returned items
  let totalBalance = 0;
  closedRentals.forEach((item) => {
    if (item.deliveryDate && item.returnDate) {
      const days =
        Math.floor(
          (new Date(item.returnDate) - new Date(item.deliveryDate)) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      const amount =
        (item.itemDetail?.price || 0) * (item.itemDetail?.quantity || 0) * days;
      totalBalance += amount - (item.itemDetail?.advanceAmount || 0);
    }
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - SRK Retails</title>
  <style>
    /* CSS Reset and Base Styles */
    .invoice-wrapper * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .invoice-wrapper {
      overflow: visible !important;
      background-color: white;
      color: black;
      font-family: sans-serif;
    }

    /* A4 Paper Size Container */
    .invoice-main-container {
      display: flex;
      flex-direction: column;
      max-width: 210mm;
      min-width: 210mm;
      max-height: 297mm;
      min-height: 297mm;
      background: white;
      padding-right: 2mm;
      // border: 2px solid #2c5aa0;
      margin: 0 auto;
    }

    .invoice-company-branding {
      display: flex;
      justify-items: center;
      align-items: center;
      flex-direction: column;
    }

    /* Header Styles */
    .invoice-main-header {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      margin-bottom: 10px;
      margin-top: 10px;
      border-bottom: 3px solid #2c5aa0;
    }

    .invoice-grace-text {
      margin-top: -10px;
      font-style: italic;
      color: #2c5aa0;
      font-size: 14px;
    }

    .invoice-customer-sign {
      margin-left: 30px;
    }

    .invoice-srk-letters {
      font-family: Arial, sans-serif;
      font-size: 64px;
      font-weight: 900;
      color: #2c5aa0;
      letter-spacing: 35px;
      line-height: 1;
      margin-left: 35px;
      margin-bottom: 10px;
    }

    .invoice-company-title {
      margin-top: -15px;
      font-size: 18px;
      color: #2c5aa0;
      font-weight: bold;
      word-spacing: 10px;
    }

    .invoice-company-details {
      display: flex;
      align-items: center;
      justify-items: center;
      flex-direction: column;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
    }

    .invoice-address {
      margin-bottom: 5px;
    }

    .invoice-contact {
      margin-bottom: 5px;
      font-weight: bold;
    }

    /* Invoice Information Section */
    .invoice-main-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 10px;
      border: 1px solid #2c5aa0;
      background-color: #f8f9ff;
    }

    .invoice-info-left,
    .invoice-info-right {
      width: 48%;
    }

    .invoice-field {
      display: flex;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .invoice-label {
      font-weight: bold;
      color: #2c5aa0;
      display: inline-block;
      width: 120px;
    }

    .invoice-value {
      color: #333;
    }

    /* Items Table */
    .invoice-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: 2px solid #2c5aa0;
    }

    .invoice-items-table th {
      background-color: #2c5aa0;
      color: white;
      padding: 12px 8px;
      text-align: center;
      font-weight: bold;
      font-size: 12px;
      border: 1px solid black;
    }

    .invoice-items-table td {
      padding: 10px 8px;
      text-align: center;
      border: 1px solid #2c5aa0;
      font-size: 12px;
    }

    .invoice-serial-no {
      width: 8%;
    }

    .invoice-item-description {
      width: 30%;
      text-align: left !important;
    }

    .invoice-size {
      width: 10%;
    }

    .invoice-quantity {
      width: 10%;
    }

    .invoice-rate {
      width: 15%;
    }

    .invoice-amount {
      width: 15%;
    }

    .invoice-discount {
      width: 12%;
    }

    .invoice-item-row {
      background-color: white;
    }

    .invoice-item-row:nth-child(even) {
      background-color: #f8f9ff;
    }

    /* Total Section */
    .invoice-total-section {
      text-align: right;
      margin-bottom: 10px;
      font-size: 16px;
      font-weight: bold;
      color: #2c5aa0;
      border: 1px solid #2c5aa0;
      padding: 10px;
      background-color: #f8f9ff;
    }

    /* Signature Section */
    .invoice-signature-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      gap: 20px;
    }

    .invoice-signature-box {
      width: 50%;
      border: 1px solid #2c5aa0;
      padding: 10px;
      background-color: #f8f9ff;
    }

    .invoice-signature-title {
      font-weight: bold;
      color: #2c5aa0;
      text-align: center;
      margin-bottom: 5px;
      font-size: 12px;
    }

    .invoice-signature-details {
      font-size: 10px;
      line-height: 2;
    }

    .invoice-signature-details > div {
      margin-top: 8px;
      display: flex;
      align-items: baseline;
    }

    .invoice-signature-details strong {
      display: inline-block;
      min-width: 80px;
      color: #2c5aa0;
    }

    /* Footer Notice */
    .invoice-footer-notice {
      margin-bottom: 10px;
      padding: 10px;
      border: 1px solid #2c5aa0;
      background-color: #fff8dc;
      font-size: 11px;
      line-height: 1.4;
    }

    /* Company Footer */
    .invoice-company-footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #2c5aa0;
      padding-top: 20px;
      margin-bottom: 20px;
    }

    .invoice-footer-left {
      font-size: 12px;
      color: #2c5aa0;
    }

    .invoice-greet {
      font-size: 12px;
      color: #2c5aa0;
    }

    .invoice-footer-right {
      text-align: center;
      font-size: 12px;
    }

    .invoice-footer-right strong {
      color: #2c5aa0;
    }
.invoice-company-name {
      display: flex;
      justify-items: center;
      align-items: center;
      flex-direction: column;
  //  margin-top: 20px; 
  //  margin-bottom: 10px; 
}
    .invoice-signature-line {
      margin-top: 20px;
      border-bottom: 1px solid #333;
      width: 150px;
      margin-left: auto;
      margin-right: auto;
    }

    @page {
      size: A4;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="invoice-main-container">
      <!-- Header -->
      <header class="invoice-main-header">
        <div class="invoice-company-branding">
          <div class="invoice-grace-text">Grace of Lord Jesus</div>
          <div class="invoice-company-name">
            <div class="invoice-srk-letters">S R K</div>
            <div class="invoice-company-title">Retails and Equipments</div>
          </div>
        </div>
        <div class="invoice-company-details">
          <div class="invoice-address">85-B, Kadalaiyur Main Road, Kovilpatti, Pin Code 628501</div>
          <div class="invoice-contact">Contact: 9790650531, 807229 9061</div>
        </div>
      </header>

      <!-- Invoice Details Section -->
      <div class="invoice-main-info">
        <div class="invoice-info-left">
          <div class="invoice-field">
            <span class="invoice-label">Bill No:</span>
            <span class="invoice-value">${rentals[0]._id
              .toString()
              .slice(-5)}</span>
          </div>
          <div class="invoice-field">
            <span class="invoice-label">Delivery Date:</span>
            <span class="invoice-value">${dateFormatter(
              firstRental.deliveryDate
            )}</span>
          </div>
          <div class="invoice-field">
            <span class="invoice-label">Return Date:</span>
            <span class="invoice-value">${
              dateFormatter(firstRental.returnDate) || "_____________"
            }</span>
          </div>
        </div>
        <div class="invoice-info-right">
          <div class="invoice-field">
            <span class="invoice-label">Name:</span>
            <span class="invoice-value">${firstRental.customer || ""}</span>
          </div>
          <div class="invoice-field">
            <span class="invoice-label">Vehicle Number:</span>
            <span class="invoice-value">_____________</span>
          </div>
          <div class="invoice-field">
            <span class="invoice-label">Vehicle Ph No:</span>
            <span class="invoice-value">_____________</span>
          </div>
        </div>
      </div>

      <!-- Delivered Items Table -->
      <table class="invoice-items-table">
        <thead>
          <tr>
            <th class="invoice-serial-no">S.No</th>
            <th class="invoice-item-description">Delivered Item Details</th>
            <th class="invoice-size">Size</th>
            <th class="invoice-quantity">Qty</th>
            <th class="invoice-rate">Rate per Unit</th>
            <th class="invoice-amount">Rent per Day</th>
            <th class="invoice-discount">Advance</th>
          </tr>
        </thead>
        <tbody>
          ${rentals
            .map(
              (item, index) => `
          <tr class="invoice-item-row">
            <td class="invoice-serial-no">${index + 1}</td>
            <td class="invoice-item-description">${
              item.itemDetail?.name || "-"
            }</td>
            <td class="invoice-size">${item.itemDetail?.size || "-"}</td>
            <td class="invoice-quantity">${
              item.itemDetail?.quantity || "-"
            }</td>
            <td class="invoice-rate">${item.itemDetail?.price || 0} Rs</td>
            <td class="invoice-amount">${
              (item.itemDetail?.quantity || 0) * (item.itemDetail?.price || 0)
            } Rs</td>
            <td class="invoice-discount">${
              item.itemDetail?.advanceAmount || 0
            }</td>
          </tr>
        `
            )
            .join("")}
        </tbody>
      </table>

      ${
        closedRentals.length > 0
          ? `
      <!-- Returned Items Table -->
      <table class="invoice-items-table">
        <thead>
          <tr>
            <th class="invoice-serial-no">S.No</th>
            <th class="invoice-item-description">Returned Item Details</th>
            <th class="invoice-size">Size</th>
            <th class="invoice-quantity">Qty</th>
            <th class="invoice-quantity">Days</th>
            <th class="invoice-amount">Amount</th>
            <th class="invoice-amount">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${closedRentals
            .map((item, index) => {
              const days =
                item.deliveryDate && item.returnDate
                  ? Math.floor(
                      (new Date(item.returnDate) -
                        new Date(item.deliveryDate)) /
                        (1000 * 60 * 60 * 24)
                    ) + 1
                  : "-";
              const amount =
                typeof days === "number"
                  ? (item.itemDetail?.price || 0) *
                    (item.itemDetail?.quantity || 0) *
                    days
                  : 0;
              const balance = amount - (item.itemDetail?.advanceAmount || 0);

              return `
          <tr class="invoice-item-row">
            <td class="invoice-serial-no">${index + 1}</td>
            <td class="invoice-item-description">${
              item.itemDetail?.name || "-"
            }</td>
            <td class="invoice-size">${item.itemDetail?.size || "-"}</td>
            <td class="invoice-quantity">${
              item.itemDetail?.quantity || "-"
            }</td>
            <td class="invoice-quantity">${days}</td>
            <td class="invoice-amount">${amount} Rs</td>
            <td class="invoice-amount">${balance} Rs</td>
          </tr>
        `;
            })
            .join("")}
        </tbody>
      </table>

      <!-- Total Section -->
      <div class="invoice-total-section">
        Total: ${totalBalance} Rs
      </div>
      `
          : ""
      }

      <!-- Signature Section -->
      <div class="invoice-signature-section">
        <div class="invoice-signature-box">
          <div class="invoice-signature-title">Customer Address</div>
          <div class="invoice-signature-details">
            <div>
              <strong>Name:</strong> ${
                firstRental.customer || "_________________________________________"
              }
            </div>
            <div>
              <strong>Phone No:</strong> ${
                firstRental.clientPhoneNumber || "_________________________________________"
              }
            </div>
            <div>
              <strong>Address:</strong> _________________________________________
            </div>
            <div>
              <strong>Aadhar:</strong> ${
                firstRental.clientAadhaar || "_________________________________________"
              }
            </div>
          </div>
        </div>
        <div class="invoice-signature-box">
          <div class="invoice-signature-title">Site Address</div>
          <div class="invoice-signature-details">
            <div>
              <strong>Name:</strong> _________________________________________
            </div>
            <div>
              <strong>Phone No:</strong> _________________________________________
            </div>
            <div>
              <strong>Address:</strong> _________________________________________
            </div>
            <div>
              <strong>Landmark:</strong> _________________________________________
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Notice -->
      <div class="invoice-footer-notice">
        <p>
          <strong>குறிப்பு:</strong> மேற்கண்ட சைட்டை தவிர வேறு சைட்டில் உபயோகிக்க மாட்டேன்.
          பொருள் சேதமடைந்தால் அதற்குண்டான செலவுகளை ஏற்றுக்கெள்வது, பொருட்களை திருப்பி கொடுக்கும்போது
          சுத்தம் செய்து ஆயில் அடித்துதருவது சம்மதிக்கிறேன்.
        </p>
      </div>

      <!-- Company Footer -->
      <div class="invoice-company-footer">
        <div class="invoice-footer-left">
          <div class="invoice-customer-sign">Customer Signature</div>
        </div>
        <div class="invoice-greet">
          Thank you for your business Visit again
        </div>
        <div class="invoice-footer-right">
          <div>For</div>
          <div><strong>SRK Retails and Equipments</strong></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

async function previewInvoice(req, res) {
  try {
    // Support both GET (query params) and POST (body)
    let rentalIds = req.body?.rentalIds || req.query.rentalIds;

    // If rentalIds is a string, convert it to an array
    if (typeof rentalIds === 'string') {
      rentalIds = [rentalIds];
    }

    const ownerId = req.user.userId;

    if (!rentalIds || !Array.isArray(rentalIds) || rentalIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rentalIds array is required (either in body or query params)",
      });
    }

    // Fetch all rentals
    const rentals = await Rental.find({
      _id: { $in: rentalIds },
      ownerId: ownerId,
    });

    if (!rentals || rentals.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No rentals found for the provided IDs",
      });
    }

    // Generate HTML for the invoice
    const invoiceHTML = generateInvoiceHTML(rentals);

    // Send HTML response for preview
    res.setHeader("Content-Type", "text/html");
    return res.send(invoiceHTML);
  } catch (error) {
    console.error("Error generating invoice preview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice preview",
      error: error.message,
    });
  }
}

module.exports = {
  generateInvoicePDF,
  previewInvoice,
};
