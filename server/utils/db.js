const mongoose = require("mongoose");
const config = require("./config");

// Set up mongoose connection options with connection pooling
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2, // Minimum number of connections in the pool
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true, // Retry write operations on network errors
  w: "majority", // Write concern: wait for write to be acknowledged by majority of replicas
};

/**
 * Connect to MongoDB Atlas with retry mechanism
 * @param {number} retryCount - Number of connection retries
 * @returns {Promise<void>}
 */
const connectDB = async (retryCount = 5) => {
  try {
    await mongoose.connect(config.MONGODB_URI, connectionOptions);
    console.log("MongoDB Atlas connected successfully");

    // Set up connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      // Attempt to reconnect if not shutting down
      if (!mongoose.connection.readyState === 0) {
        console.log("Attempting to reconnect to MongoDB...");
        setTimeout(() => connectDB(1), 5000); // Wait 5 seconds before reconnecting
      }
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      // Attempt to reconnect if not shutting down
      if (!mongoose.connection.readyState === 0) {
        console.log("Attempting to reconnect to MongoDB...");
        setTimeout(() => connectDB(1), 5000); // Wait 5 seconds before reconnecting
      }
    });

    // Handle application termination
    process.on("SIGINT", async () => {
      await disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    if (retryCount > 0) {
      console.log(`Retrying connection... (${retryCount} attempts left)`);
      // Exponential backoff: wait longer between each retry
      const waitTime = (6 - retryCount) * 1000;
      setTimeout(() => connectDB(retryCount - 1), waitTime);
    } else {
      console.error("Failed to connect to MongoDB after multiple attempts");
      process.exit(1);
    }
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected gracefully");
  } catch (error) {
    console.error("MongoDB disconnection error:", error.message);
  }
};

/**
 * Check if MongoDB is connected
 * @returns {boolean}
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get MongoDB connection stats
 * @returns {Object} Connection statistics
 */
const getConnectionStats = async () => {
  if (!isConnected()) {
    return { connected: false };
  }

  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();

    return {
      connected: true,
      version: serverStatus.version,
      uptime: serverStatus.uptime,
      connections: serverStatus.connections,
      network: serverStatus.network,
      mem: serverStatus.mem,
    };
  } catch (error) {
    console.error("Error getting MongoDB stats:", error);
    return {
      connected: isConnected(),
      error: error.message,
    };
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  isConnected,
  getConnectionStats,
};
