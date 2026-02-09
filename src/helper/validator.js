/**
 * Validates if a delivery date is valid
 * @param {string|Date} deliveryDate - The delivery date to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
function isDeliveryDateValid(deliveryDate) {
  if (!deliveryDate) {
    return {
      isValid: false,
      message: "Delivery date is required",
    };
  }

  const deliveryDateTime = new Date(deliveryDate);

  // Check if the date is valid
  if (isNaN(deliveryDateTime.getTime())) {
    return {
      isValid: false,
      message: "Invalid delivery date format",
    };
  }

  // Check if delivery date is in the future
  const now = new Date();
  if (deliveryDateTime > now) {
    return {
      isValid: false,
      message: "Delivery date cannot be in the future",
    };
  }

  return {
    isValid: true,
    message: "Delivery date is valid",
  };
}

/**
 * Validates if a return date is after the delivery date
 * @param {string|Date} returnDate - The return date to validate
 * @param {string|Date} deliveryDate - The delivery date to compare against
 * @returns {Object} - { isValid: boolean, message: string }
 */
function isReturnDateValid(returnDate, deliveryDate) {
  // Return date is optional, so if not provided, it's valid
  if (!returnDate) {
    return {
      isValid: true,
      message: "Return date is optional",
    };
  }

  if (!deliveryDate) {
    return {
      isValid: false,
      message: "Delivery date is required to validate return date",
    };
  }

  const returnDateTime = new Date(returnDate);
  const deliveryDateTime = new Date(deliveryDate);

  // Check if the dates are valid
  if (isNaN(returnDateTime.getTime())) {
    return {
      isValid: false,
      message: "Invalid return date format",
    };
  }

  if (isNaN(deliveryDateTime.getTime())) {
    return {
      isValid: false,
      message: "Invalid delivery date format",
    };
  }

  // Check if return date is after delivery date
  if (returnDateTime <= deliveryDateTime) {
    return {
      isValid: false,
      message: "Return date must be after delivery date",
    };
  }

  return {
    isValid: true,
    message: "Return date is valid",
  };
}

module.exports = {
  isDeliveryDateValid,
  isReturnDateValid,
};
