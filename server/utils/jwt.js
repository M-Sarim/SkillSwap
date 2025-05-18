const jwt = require("jsonwebtoken");
const config = require("./config");

/**
 * Generate a JWT token
 * @param {Object} payload - The data to include in the token
 * @returns {string} - The JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} - The decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} - The JWT token or null if not found
 */
const getTokenFromHeaders = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
};

module.exports = {
  generateToken,
  verifyToken,
  getTokenFromHeaders,
};
