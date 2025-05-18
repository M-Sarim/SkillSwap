const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("./db");

/**
 * Create indexes for all collections to improve query performance
 */
const createIndexes = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to MongoDB. Creating indexes...");

    // Get all models
    const User = mongoose.model("User");
    const Client = mongoose.model("Client");
    const Freelancer = mongoose.model("Freelancer");
    const Project = mongoose.model("Project");
    const Bid = mongoose.model("Bid");
    const Contract = mongoose.model("Contract");
    const Message = mongoose.model("Message");
    const Notification = mongoose.model("Notification");
    const TimeTracking = mongoose.model("TimeTracking");
    const Finance = mongoose.model("Finance");

    // Create indexes for User collection
    console.log("Creating indexes for User collection...");
    await User.collection.createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { role: 1 } },
      { key: { isVerified: 1 } },
      { key: { createdAt: 1 } },
    ]);

    // Create indexes for Client collection
    console.log("Creating indexes for Client collection...");
    await Client.collection.createIndexes([
      { key: { user: 1 }, unique: true },
      { key: { company: 1 } },
      { key: { location: 1 } },
    ]);

    // Create indexes for Freelancer collection
    console.log("Creating indexes for Freelancer collection...");
    await Freelancer.collection.createIndexes([
      { key: { user: 1 }, unique: true },
      { key: { skills: 1 } },
      { key: { hourlyRate: 1 } },
      { key: { verified: 1 } },
      { key: { averageRating: 1 } },
    ]);

    // Create indexes for Project collection
    console.log("Creating indexes for Project collection...");
    await Project.collection.createIndexes([
      { key: { client: 1 } },
      { key: { freelancer: 1 } },
      { key: { category: 1 } },
      { key: { skills: 1 } },
      { key: { status: 1 } },
      { key: { budget: 1 } },
      { key: { deadline: 1 } },
      { key: { createdAt: 1 } },
      { key: { paymentType: 1 } },
    ]);

    // Create indexes for Bid collection
    console.log("Creating indexes for Bid collection...");
    await Bid.collection.createIndexes([
      { key: { project: 1, freelancer: 1 }, unique: true },
      { key: { status: 1 } },
      { key: { amount: 1 } },
      { key: { createdAt: 1 } },
    ]);

    // Create indexes for Contract collection
    console.log("Creating indexes for Contract collection...");
    await Contract.collection.createIndexes([
      { key: { project: 1 }, unique: true },
      { key: { client: 1 } },
      { key: { freelancer: 1 } },
      { key: { status: 1 } },
      { key: { startDate: 1 } },
      { key: { endDate: 1 } },
    ]);

    // Create indexes for Message collection
    console.log("Creating indexes for Message collection...");
    await Message.collection.createIndexes([
      { key: { sender: 1, receiver: 1 } },
      { key: { project: 1 } },
      { key: { "readStatus.isRead": 1 } },
      { key: { createdAt: 1 } },
    ]);

    // Create indexes for Notification collection
    console.log("Creating indexes for Notification collection...");
    await Notification.collection.createIndexes([
      { key: { recipient: 1 } },
      { key: { sender: 1 } },
      { key: { type: 1 } },
      { key: { read: 1 } },
      { key: { createdAt: 1 } },
    ]);

    // Create indexes for TimeTracking collection
    console.log("Creating indexes for TimeTracking collection...");
    await TimeTracking.collection.createIndexes([
      { key: { project: 1, freelancer: 1 }, unique: true },
      { key: { lastUpdated: 1 } },
    ]);

    // Create indexes for Finance collection
    console.log("Creating indexes for Finance collection...");
    await Finance.collection.createIndexes([
      { key: { type: 1, status: 1 } },
      { key: { client: 1 } },
      { key: { freelancer: 1 } },
      { key: { project: 1 } },
      { key: { createdAt: 1 } },
    ]);

    console.log("All indexes created successfully!");

    // Disconnect from database
    await disconnectDB();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error creating indexes:", error);
    process.exit(1);
  }
};

// Run the function if this script is executed directly
if (require.main === module) {
  createIndexes();
}

module.exports = createIndexes;
