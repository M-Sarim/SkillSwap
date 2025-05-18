const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require('./config');

/**
 * Hash a password using bcrypt
 * @param {string} password - The plain text password
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - The plain text password
 * @param {string} hashedPassword - The hashed password
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a SHA-256 hash for sensitive data
 * @param {string} data - The data to hash
 * @returns {string} - The hashed data
 */
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a random token
 * @param {number} bytes - Number of bytes for the token
 * @returns {string} - The generated token
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash message metadata for privacy
 * @param {Object} metadata - The message metadata
 * @returns {string} - The hashed metadata
 */
const hashMessageMetadata = (metadata) => {
  const metadataString = JSON.stringify(metadata);
  return hashData(metadataString);
};

module.exports = {
  hashPassword,
  comparePassword,
  hashData,
  generateToken,
  hashMessageMetadata
};
