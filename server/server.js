const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { connectDB, isConnected, getConnectionStats } = require("./utils/db");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth/authRoutes");
const projectRoutes = require("./routes/projects/projectRoutes");
const notificationRoutes = require("./routes/notifications/notificationRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const messageRoutes = require("./routes/messages/messageRoutes");
const clientRoutes = require("./routes/client/clientRoutes");
const freelancerRoutes = require("./routes/freelancer/freelancerRoutes");

// Import middleware
const errorMiddleware = require("./middleware/error");

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Connect to MongoDB Atlas with enhanced connection pooling and error recovery
connectDB();

// Create indexes for better performance (if in production)
if (process.env.NODE_ENV === "production") {
  // Import and run createIndexes in the background
  const createIndexes = require("./utils/createIndexes");
  createIndexes().catch((err) => console.error("Error creating indexes:", err));

  // Schedule database backups
  const { scheduleBackups } = require("./utils/dbBackup");
  // Schedule backups every 24 hours
  scheduleBackups(24);
}

// Socket.io connection
io.on("connection", (socket) => {
  console.log("New client connected");

  // Store auth token if provided
  if (socket.handshake.auth && socket.handshake.auth.token) {
    try {
      // Extract user ID from token if possible
      const token = socket.handshake.auth.token;
      console.log("Socket connected with auth token");

      // We're not verifying the token here since we don't have access to jwt
      // But in a real implementation, you would verify the token and extract the user ID
      // socket.userId = decoded.id;
    } catch (err) {
      console.error("Socket authentication error:", err);
    }
  }

  // Join a room (for private messaging)
  socket.on("join", (userId) => {
    socket.join(userId);
    // Also store the userId on the socket object for direct access
    socket.userId = userId;
    console.log(`User ${userId} joined their room and set as socket.userId`);
  });

  // Handle private messages
  socket.on("privateMessage", ({ senderId, receiverId, content }) => {
    io.to(receiverId).emit("newMessage", {
      senderId,
      content,
      timestamp: new Date(),
    });
  });

  // Handle bid notifications
  socket.on("newBid", ({ projectId, bid }) => {
    io.emit("bidUpdate", { projectId, bid });
  });

  // Handle bid acceptance
  socket.on("bidAccepted", ({ projectId, freelancerId, project }) => {
    console.log(
      `Socket: Bid accepted for project ${projectId} by freelancer ${freelancerId}`
    );

    // Emit to all clients (for updating UI)
    io.emit("bidAcceptedUpdate", { projectId, project });

    // Emit specifically to the freelancer whose bid was accepted
    io.to(freelancerId).emit("yourBidAccepted", {
      projectId,
      project,
      message: `Your bid for project "${project.title}" has been accepted!`,
      timestamp: new Date(),
    });

    console.log(`Socket: Notification sent to freelancer ${freelancerId}`);
  });

  // Handle counter offers
  socket.on(
    "counterOffer",
    ({
      projectId,
      bidId,
      freelancerId,
      counterOffer,
      clientId,
      clientName,
    }) => {
      console.log(
        `Socket: Counter offer made for bid ${bidId} on project ${projectId} to freelancer ${freelancerId}`
      );
      console.log(`Socket: Counter offer details:`, {
        counterOffer,
        clientId,
        clientName,
      });

      // Emit to all clients (for updating UI)
      io.emit("counterOfferUpdate", { projectId, bidId, counterOffer });

      // Emit specifically to the freelancer who received the counter offer
      if (freelancerId) {
        console.log(
          `Socket: Sending counter offer notification to freelancer ${freelancerId}`
        );

        // Try multiple ways to ensure delivery

        // 1. Direct to the freelancer's room
        socket.to(freelancerId).emit("counterOfferReceived", {
          projectId,
          bidId,
          counterOffer,
          clientId,
          clientName,
          message: `You have received a counter offer for your bid on project with ID ${projectId}`,
          timestamp: new Date(),
        });

        // 2. Broadcast to all sockets (will be filtered on client side)
        io.emit("counterOfferBroadcast", {
          projectId,
          bidId,
          freelancerId,
          counterOffer,
          clientId,
          clientName,
          timestamp: new Date(),
        });

        // 3. Direct message to all sockets of this freelancer
        const freelancerSockets = Array.from(
          io.sockets.sockets.values()
        ).filter((s) => s.userId === freelancerId);

        console.log(
          `Found ${freelancerSockets.length} sockets for freelancer ${freelancerId}`
        );

        freelancerSockets.forEach((s) => {
          s.emit("counterOfferReceived", {
            projectId,
            bidId,
            counterOffer,
            clientId,
            clientName,
            message: `You have received a counter offer for your bid on project with ID ${projectId}`,
            timestamp: new Date(),
          });
        });

        console.log(
          `Socket: Counter offer notification sent to freelancer ${freelancerId} via multiple channels`
        );
      } else {
        console.log(
          `Socket: No freelancerId provided for counter offer notification`
        );
      }
    }
  );

  // Handle counter offer responses (accept/reject)
  socket.on(
    "counterOfferResponse",
    ({
      projectId,
      bidId,
      freelancerId,
      freelancerName,
      clientId,
      accepted,
      amount,
      deliveryTime,
    }) => {
      console.log(
        `Socket: Counter offer ${
          accepted ? "accepted" : "rejected"
        } for bid ${bidId} on project ${projectId} by freelancer ${freelancerId}`
      );

      // Emit to all clients (for updating UI)
      io.emit("counterOfferResponseUpdate", {
        projectId,
        bidId,
        accepted,
        amount,
        deliveryTime,
      });

      // Emit specifically to the client who made the counter offer
      if (clientId) {
        console.log(
          `Socket: Sending counter offer response notification to client ${clientId}`
        );

        socket.to(clientId).emit("counterOfferResponseReceived", {
          projectId,
          bidId,
          freelancerId,
          freelancerName,
          accepted,
          amount,
          deliveryTime,
          message: `${freelancerName} has ${
            accepted ? "accepted" : "rejected"
          } your counter offer for project with ID ${projectId}`,
          timestamp: new Date(),
        });

        console.log(
          `Socket: Counter offer response notification sent to client ${clientId}`
        );
      } else {
        console.log(
          `Socket: No clientId provided for counter offer response notification`
        );
      }
    }
  );

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notify", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/freelancer", freelancerRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
}

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
