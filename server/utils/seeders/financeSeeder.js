const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("../db");
const User = require("../../models/User");
const Client = require("../../models/Client");
const Freelancer = require("../../models/Freelancer");
const Project = require("../../models/Project");
const Finance = require("../../models/Finance");

/**
 * Generate a random date between start and end dates
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Date} - Random date between start and end
 */
const randomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

/**
 * Generate a random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number between min and max
 */
const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Generate a random amount with 2 decimal places
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random amount with 2 decimal places
 */
const randomAmount = (min, max) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

/**
 * Pick a random element from an array
 * @param {Array} array - Array to pick from
 * @returns {*} - Random element from the array
 */
const randomPick = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Calculate platform fee based on amount
 * @param {number} amount - Transaction amount
 * @returns {Object} - Platform fee object with amount and percentage
 */
const calculatePlatformFee = (amount) => {
  const percentage = 10; // 10% platform fee
  const feeAmount = parseFloat((amount * (percentage / 100)).toFixed(2));
  return {
    amount: feeAmount,
    percentage,
  };
};

/**
 * Calculate tax based on amount
 * @param {number} amount - Transaction amount
 * @returns {Object} - Tax object with amount and percentage
 */
const calculateTax = (amount) => {
  const percentage = 5; // 5% tax
  const taxAmount = parseFloat((amount * (percentage / 100)).toFixed(2));
  return {
    amount: taxAmount,
    percentage,
    reference: `TAX-${Date.now().toString().slice(-6)}`,
  };
};

/**
 * Seed finance data
 */
const seedFinanceData = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to MongoDB. Seeding finance data...");

    // Clear existing finance data
    await Finance.deleteMany({});
    console.log("Cleared existing finance data");

    // Get existing users, clients, freelancers, and projects
    let clients = await Client.find().populate("user");
    let freelancers = await Freelancer.find().populate("user");
    let projects = await Project.find();
    let admin = await User.findOne({ role: "admin" });

    // Create dummy data if no real data exists
    if (
      clients.length === 0 ||
      freelancers.length === 0 ||
      projects.length === 0
    ) {
      console.warn(
        "No clients, freelancers, or projects found. Creating dummy data for seeding..."
      );

      // Create a dummy admin if none exists
      let adminUser = admin;
      if (!adminUser) {
        adminUser = await User.create({
          name: "Admin User",
          email: "admin@example.com",
          password: "password123",
          role: "admin",
          isVerified: true,
        });
        console.log("Created dummy admin user");
      }

      // Create dummy clients if none exist
      let clientsList = clients;
      if (clients.length === 0) {
        const clientUser1 = await User.create({
          name: "Client User 1",
          email: "client1@example.com",
          password: "password123",
          role: "client",
          isVerified: true,
        });

        const clientUser2 = await User.create({
          name: "Client User 2",
          email: "client2@example.com",
          password: "password123",
          role: "client",
          isVerified: true,
        });

        const client1 = await Client.create({
          user: clientUser1._id,
          company: "Company A",
          location: "Location A",
        });

        const client2 = await Client.create({
          user: clientUser2._id,
          company: "Company B",
          location: "Location B",
        });

        clientsList = [
          { _id: client1._id, user: clientUser1 },
          { _id: client2._id, user: clientUser2 },
        ];

        console.log("Created dummy clients");
      }

      // Create dummy freelancers if none exist
      let freelancersList = freelancers;
      if (freelancers.length === 0) {
        const freelancerUser1 = await User.create({
          name: "Freelancer User 1",
          email: "freelancer1@example.com",
          password: "password123",
          role: "freelancer",
          isVerified: true,
        });

        const freelancerUser2 = await User.create({
          name: "Freelancer User 2",
          email: "freelancer2@example.com",
          password: "password123",
          role: "freelancer",
          isVerified: true,
        });

        const freelancer1 = await Freelancer.create({
          user: freelancerUser1._id,
          skills: ["Web Development", "JavaScript"],
          hourlyRate: 25,
          verified: true,
        });

        const freelancer2 = await Freelancer.create({
          user: freelancerUser2._id,
          skills: ["Graphic Design", "UI/UX"],
          hourlyRate: 30,
          verified: true,
        });

        freelancersList = [
          { _id: freelancer1._id, user: freelancerUser1 },
          { _id: freelancer2._id, user: freelancerUser2 },
        ];

        console.log("Created dummy freelancers");
      }

      // Create dummy projects if none exist
      let projectsList = projects;
      if (projects.length === 0) {
        const project1 = await Project.create({
          title: "Web Development Project",
          description: "A web development project",
          client: clientsList[0]._id,
          freelancer: freelancersList[0]._id,
          budget: 1000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "In Progress",
        });

        const project2 = await Project.create({
          title: "Graphic Design Project",
          description: "A graphic design project",
          client: clientsList[1]._id,
          freelancer: freelancersList[1]._id,
          budget: 500,
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: "Open",
        });

        projectsList = [project1, project2];

        console.log("Created dummy projects");
      }

      // Update variables with dummy data
      clients = clientsList;
      freelancers = freelancersList;
      projects = projectsList;
      admin = adminUser;
    }

    if (!admin) {
      console.warn(
        "No admin user found. Some transactions will not have a createdBy field."
      );
    }

    const financeData = [];
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const endDate = new Date();

    // Generate payment transactions
    for (let i = 0; i < 50; i++) {
      try {
        const project = randomPick(projects);

        // Debug
        console.log(
          `Project ${i}: ${project.title}, ID: ${project._id}, Client: ${project.client}`
        );

        // Find client
        const client = clients.find(
          (c) => c._id.toString() === project.client.toString()
        );

        if (!client) {
          console.warn(
            `No client found for project ${project.title} (${project._id}). Skipping...`
          );
          continue;
        }

        // Find or pick freelancer
        let freelancer;
        if (project.freelancer) {
          freelancer = freelancers.find(
            (f) => f._id.toString() === project.freelancer.toString()
          );
          if (!freelancer) {
            console.warn(
              `No matching freelancer found for project ${project.title}. Using random freelancer.`
            );
            freelancer = randomPick(freelancers);
          }
        } else {
          freelancer = randomPick(freelancers);
        }

        const amount = randomAmount(100, 5000);
        const platformFee = calculatePlatformFee(amount);
        const tax = calculateTax(amount);
        const date = randomDate(startDate, endDate);

        // Payment transaction
        financeData.push({
          type: "payment",
          amount,
          currency: "USD",
          status: randomPick([
            "completed",
            "completed",
            "completed",
            "pending",
            "failed",
          ]),
          description: `Payment for project: ${project.title}`,
          project: project._id,
          client: client._id,
          freelancer: freelancer._id,
          paymentMethod: randomPick(["credit_card", "paypal", "bank_transfer"]),
          paymentReference: `PAY-${Date.now().toString().slice(-6)}`,
          platformFee,
          tax,
          processedAt: date,
          createdAt: date,
          updatedAt: date,
          createdBy: admin ? admin._id : null,
        });

        // Platform fee transaction
        financeData.push({
          type: "fee",
          amount: platformFee.amount,
          currency: "USD",
          status: "completed",
          description: `Platform fee for project: ${project.title}`,
          project: project._id,
          client: client._id,
          freelancer: freelancer._id,
          processedAt: date,
          createdAt: date,
          updatedAt: date,
          createdBy: admin ? admin._id : null,
        });
      } catch (err) {
        console.error(`Error generating payment transaction ${i}:`, err);
      }
    }

    // Generate withdrawal transactions
    for (let i = 0; i < 30; i++) {
      try {
        const freelancer = randomPick(freelancers);

        if (!freelancer || !freelancer._id) {
          console.warn(`Invalid freelancer for withdrawal ${i}. Skipping...`);
          continue;
        }

        const amount = randomAmount(50, 2000);
        const date = randomDate(startDate, endDate);

        financeData.push({
          type: "withdrawal",
          amount,
          currency: "USD",
          status: randomPick(["completed", "completed", "pending"]),
          description: `Withdrawal by freelancer: ${
            freelancer.user ? freelancer.user.name : "Unknown"
          }`,
          freelancer: freelancer._id,
          paymentMethod: randomPick(["paypal", "bank_transfer"]),
          paymentReference: `WD-${Date.now().toString().slice(-6)}`,
          processedAt: date,
          createdAt: date,
          updatedAt: date,
        });
      } catch (err) {
        console.error(`Error generating withdrawal transaction ${i}:`, err);
      }
    }

    // Generate escrow transactions
    for (let i = 0; i < 20; i++) {
      try {
        const project = randomPick(projects);

        if (!project || !project._id) {
          console.warn(`Invalid project for escrow ${i}. Skipping...`);
          continue;
        }

        // Find client
        const client = clients.find(
          (c) => c._id.toString() === project.client.toString()
        );

        if (!client) {
          console.warn(
            `No client found for project ${project.title} (${project._id}). Skipping escrow...`
          );
          continue;
        }

        // Find or pick freelancer
        let freelancer;
        if (project.freelancer) {
          freelancer = freelancers.find(
            (f) => f._id.toString() === project.freelancer.toString()
          );
          if (!freelancer) {
            console.warn(
              `No matching freelancer found for project ${project.title}. Using random freelancer for escrow.`
            );
            freelancer = randomPick(freelancers);
          }
        } else {
          freelancer = randomPick(freelancers);
        }

        if (!freelancer || !freelancer._id) {
          console.warn(`Invalid freelancer for escrow ${i}. Skipping...`);
          continue;
        }

        const amount = randomAmount(100, 3000);
        const date = randomDate(startDate, endDate);
        const releaseDate = new Date(
          date.getTime() + randomNumber(3, 30) * 24 * 60 * 60 * 1000
        );

        financeData.push({
          type: "escrow",
          amount,
          currency: "USD",
          status: "completed",
          description: `Escrow for project: ${project.title}`,
          project: project._id,
          client: client._id,
          freelancer: freelancer._id,
          escrow: {
            releaseDate,
            conditions: "Project milestone completion",
            status: randomPick(["held", "released", "held", "held"]),
          },
          processedAt: date,
          createdAt: date,
          updatedAt: date,
        });
      } catch (err) {
        console.error(`Error generating escrow transaction ${i}:`, err);
      }
    }

    // Generate refund transactions
    for (let i = 0; i < 5; i++) {
      try {
        const project = randomPick(projects);

        if (!project || !project._id) {
          console.warn(`Invalid project for refund ${i}. Skipping...`);
          continue;
        }

        // Find client
        const client = clients.find(
          (c) => c._id.toString() === project.client.toString()
        );

        if (!client) {
          console.warn(
            `No client found for project ${project.title} (${project._id}). Skipping refund...`
          );
          continue;
        }

        // Find or pick freelancer
        let freelancer;
        if (project.freelancer) {
          freelancer = freelancers.find(
            (f) => f._id.toString() === project.freelancer.toString()
          );
          if (!freelancer) {
            console.warn(
              `No matching freelancer found for project ${project.title}. Using random freelancer for refund.`
            );
            freelancer = randomPick(freelancers);
          }
        } else {
          freelancer = randomPick(freelancers);
        }

        if (!freelancer || !freelancer._id) {
          console.warn(`Invalid freelancer for refund ${i}. Skipping...`);
          continue;
        }

        const amount = randomAmount(50, 500);
        const date = randomDate(startDate, endDate);

        financeData.push({
          type: "refund",
          amount,
          currency: "USD",
          status: "completed",
          description: `Refund for project: ${project.title}`,
          project: project._id,
          client: client._id,
          freelancer: freelancer._id,
          refund: {
            reason: randomPick([
              "Client not satisfied with work",
              "Project cancelled",
              "Freelancer unable to complete work",
              "Mutual agreement",
            ]),
          },
          processedAt: date,
          createdAt: date,
          updatedAt: date,
          createdBy: admin ? admin._id : null,
        });
      } catch (err) {
        console.error(`Error generating refund transaction ${i}:`, err);
      }
    }

    // Insert finance data
    await Finance.insertMany(financeData);
    console.log(`Inserted ${financeData.length} finance records`);

    // Disconnect from database
    await disconnectDB();
    console.log("Disconnected from MongoDB. Finance data seeded successfully!");
  } catch (error) {
    console.error("Error seeding finance data:", error);
    await disconnectDB();
    process.exit(1);
  }
};

// Run the seeder if this script is executed directly
if (require.main === module) {
  seedFinanceData();
}

module.exports = seedFinanceData;
