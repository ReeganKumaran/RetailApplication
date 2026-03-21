const { logger } = require("../helper/logger");
const requestIp = require("request-ip");
const getIP = (req, res, next) => {
    const clientIp = requestIp.getClientIp(req); // e.g., '127.0.0.1'
    logger.info(`Client IP: ${clientIp}`);
    next();
};

module.exports = {getIP};  