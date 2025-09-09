// responseMiddleware.js
module.exports = (req, res, next) => {
  res.success = (data = {}, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      statusCode,
      status: "OK",
      data,
    });
  };

  res.error = (message = "Something went wrong", statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      message,
      statusCode,
      status: "ERROR",
    });
  };

  next();
};
