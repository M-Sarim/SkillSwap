const Project = require("../../models/Project");
const Freelancer = require("../../models/Freelancer");
const Client = require("../../models/Client");
const User = require("../../models/User");
const Bid = require("../../models/Bid");
const Notification = require("../../models/Notification");
const config = require("../../utils/config");
const notificationService = require("../../utils/notificationService");

/**
 * Submit a bid on a project
 * @route POST /api/projects/:projectId/bids
 * @access Private (Freelancer only)
 */
const submitBid = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { amount, deliveryTime, proposal, milestones } = req.body;

    console.log("Received bid submission:", {
      projectId,
      amount,
      deliveryTime,
      proposal,
      userId: req.user._id,
    });

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      console.log("Freelancer profile not found for user:", req.user._id);
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found",
      });
    }

    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      console.log("Project not found:", projectId);
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if project is open for bids
    if (project.status !== "Open") {
      console.log("Project is not open for bids. Status:", project.status);
      return res.status(400).json({
        success: false,
        message: "This project is not open for bids",
      });
    }

    // Check if freelancer has already bid on this project
    const existingBid = project.bids.find(
      (bid) =>
        bid.freelancer &&
        bid.freelancer.toString() === freelancer._id.toString()
    );

    if (existingBid) {
      console.log("Freelancer has already bid on this project");
      return res.status(400).json({
        success: false,
        message: "You have already bid on this project",
      });
    }

    // Create bid
    const newBid = {
      freelancer: freelancer._id,
      amount,
      deliveryTime,
      proposal,
      status: "Pending",
      milestones: milestones || [],
    };

    console.log("Adding new bid to project:", newBid);

    // Add bid to project
    project.bids.push(newBid);
    await project.save();

    // Get the newly created bid from the project
    const savedBid = project.bids[project.bids.length - 1];

    // Create bid in separate collection
    const bid = await Bid.create({
      project: project._id,
      freelancer: freelancer._id,
      amount,
      deliveryTime,
      proposal,
      status: "Pending",
      milestones: milestones || [],
    });

    console.log("Bid created in separate collection:", bid._id);

    // Notify client about the new bid
    try {
      // Get client user ID
      const clientDoc = await Client.findById(project.client).populate("user");
      if (clientDoc && clientDoc.user) {
        await notificationService.notifyClientNewBid(
          clientDoc.user._id,
          req.user._id,
          project._id,
          project.title,
          amount
        );
        console.log("Notification sent to client:", clientDoc.user._id);
      }
    } catch (notificationError) {
      console.error("Error sending bid notification:", notificationError);
      // Continue even if notification fails
    }

    console.log(`New bid received for project: ${project.title}`);

    // Prepare the response with the bid data in a consistent format
    const bidResponse = {
      _id: bid._id,
      project: bid.project,
      freelancer: {
        _id: freelancer._id,
        user: {
          _id: req.user._id,
          name: req.user.name,
        },
      },
      amount: bid.amount,
      deliveryTime: bid.deliveryTime,
      proposal: bid.proposal,
      status: bid.status,
      createdAt: bid.createdAt,
      milestones: bid.milestones || [],
    };

    console.log("Sending bid response:", bidResponse);

    res.status(201).json({
      success: true,
      message: "Bid submitted successfully",
      data: bidResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bids for a project
 * @route GET /api/projects/:projectId/bids
 * @access Private (Project owner only)
 */
const getProjectBids = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is the project owner
    if (!project.client.equals(client._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view bids for this project",
      });
    }

    // Get bids
    const bids = await Bid.getProjectBids(projectId);

    res.status(200).json({
      success: true,
      data: {
        bids,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bids by a freelancer
 * @route GET /api/bids/freelancer
 * @access Private (Freelancer only)
 */
const getFreelancerBids = async (req, res, next) => {
  try {
    console.log("Getting bids for freelancer user:", req.user._id);

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      console.log("Freelancer profile not found for user:", req.user._id);
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found",
      });
    }

    console.log("Found freelancer profile:", freelancer._id);

    // Get bids
    try {
      console.log("Fetching bids for freelancer:", freelancer._id);

      // Get bids from the Bid collection
      const bids = await Bid.getFreelancerBids(freelancer._id);
      console.log("Fetched bids:", bids.length);

      // For each bid, check if there's a counter offer in the Project collection
      // This ensures we get the most up-to-date counter offer data
      const projectIds = bids.map((bid) => bid.project?._id).filter((id) => id);
      const projects = await Project.find({
        _id: { $in: projectIds },
      }).select("bids");

      // Create a map of project bids for quick lookup
      const projectBidsMap = {};
      projects.forEach((project) => {
        project.bids.forEach((bid) => {
          const key = `${project._id}-${bid.freelancer}`;
          if (bid.counterOffer) {
            projectBidsMap[key] = {
              status: bid.status,
              counterOffer: bid.counterOffer,
            };
          }
        });
      });

      // Update bids with counter offer data from projects
      const updatedBids = bids.map((bid) => {
        // Skip bids with null project references
        if (!bid.project || !bid.project._id) {
          console.log("Skipping bid with null project reference:", bid._id);
          return bid;
        }

        const key = `${bid.project._id}-${bid.freelancer._id}`;
        if (projectBidsMap[key]) {
          return {
            ...bid.toObject(),
            status: projectBidsMap[key].status || bid.status,
            counterOffer: projectBidsMap[key].counterOffer || bid.counterOffer,
          };
        }
        return bid;
      });

      console.log("Updated bids with counter offers:", updatedBids.length);

      // Get bid statistics
      try {
        console.log("Fetching bid statistics for freelancer:", freelancer._id);
        const stats = await Bid.getBidStats(freelancer._id);
        console.log("Fetched bid statistics:", stats);

        res.status(200).json({
          success: true,
          data: {
            bids: updatedBids,
            stats,
          },
        });
      } catch (statsError) {
        console.error("Error fetching bid statistics:", statsError);

        // Return bids even if stats fail
        res.status(200).json({
          success: true,
          data: {
            bids: updatedBids,
            stats: {},
          },
        });
      }
    } catch (bidsError) {
      console.error("Error fetching bids:", bidsError);
      next(bidsError);
    }
  } catch (error) {
    console.error("Error in getFreelancerBids:", error);
    next(error);
  }
};

/**
 * Accept a bid
 * @route PUT /api/projects/:projectId/bids/:bidId/accept
 * @access Private (Project owner only)
 */
const acceptBid = async (req, res, next) => {
  try {
    const { projectId, bidId } = req.params;

    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    // Find project
    let project = await Project.findById(projectId)
      .populate("client", "user")
      .populate({
        path: "bids.freelancer",
        select: "user",
        populate: {
          path: "user",
          select: "_id name",
        },
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is the project owner
    if (!project.client._id.equals(client._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept bids for this project",
      });
    }

    // Find bid
    const bid = project.bids.id(bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if bid can be accepted
    if (bid.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "This bid cannot be accepted",
      });
    }

    // Update bid status
    bid.status = "Accepted";

    // Update project status and assign freelancer
    project.status = "In Progress";
    project.freelancer = bid.freelancer;
    project.startDate = new Date();

    console.log(
      `Assigning project ${project._id} to freelancer ${bid.freelancer}`
    );

    // Double check that the freelancer field is set correctly
    if (!project.freelancer) {
      console.error("Freelancer field not set properly");
      project.freelancer = bid.freelancer;
    }

    // Update other bids to rejected
    project.bids.forEach((b) => {
      if (b._id.toString() !== bidId && b.status === "Pending") {
        b.status = "Rejected";
      }
    });

    await project.save();

    // Update bid in separate collection
    await Bid.findOneAndUpdate(
      { project: projectId, freelancer: bid.freelancer },
      { status: "Accepted" }
    );

    // Update other bids in separate collection
    await Bid.updateMany(
      {
        project: projectId,
        freelancer: { $ne: bid.freelancer },
        status: "Pending",
      },
      { status: "Rejected" }
    );

    // Create initial message between client and freelancer
    try {
      // Get the client and freelancer user IDs
      const clientUserId = req.user._id;
      const freelancerUserId = bid.freelancer.user._id;

      // Import the Message model
      const Message = require("../../models/Message");

      // Create a welcome message from client to freelancer
      const clientMessage = new Message({
        sender: clientUserId,
        receiver: freelancerUserId,
        content: `Hi! I've accepted your bid for the project "${project.title}". Looking forward to working with you!`,
        project: project._id,
      });
      await clientMessage.save();

      console.log(
        `Initial message created from client ${clientUserId} to freelancer ${freelancerUserId}`
      );
    } catch (messageError) {
      console.error("Error creating initial message:", messageError);
      // Continue with the bid acceptance even if message creation fails
    }

    // Notify freelancer about bid acceptance
    try {
      // Get freelancer user ID
      const freelancerDoc = await Freelancer.findById(bid.freelancer).populate(
        "user"
      );
      if (freelancerDoc && freelancerDoc.user) {
        await notificationService.notifyFreelancerBidAccepted(
          freelancerDoc.user._id,
          req.user._id,
          project._id,
          project.title
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending bid acceptance notification:",
        notificationError
      );
      // Continue even if notification fails
    }

    console.log(`Bid accepted for project: ${project.title}`);
    console.log(
      `Project ${project._id} assigned to freelancer ${bid.freelancer}`
    );

    // Verify the project was saved correctly
    const updatedProject = await Project.findById(projectId);
    console.log(
      `Verification - Project ${updatedProject._id} freelancer: ${updatedProject.freelancer}, status: ${updatedProject.status}`
    );

    res.status(200).json({
      success: true,
      message: "Bid accepted successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a bid
 * @route PUT /api/projects/:projectId/bids/:bidId/reject
 * @access Private (Project owner only)
 */
const rejectBid = async (req, res, next) => {
  try {
    const { projectId, bidId } = req.params;
    const { rejectionReason } = req.body;

    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    // Find project
    let project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is the project owner
    if (!project.client.equals(client._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject bids for this project",
      });
    }

    // Find bid
    const bid = project.bids.id(bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if bid can be rejected
    if (bid.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "This bid cannot be rejected",
      });
    }

    // Update bid status
    bid.status = "Rejected";
    bid.rejectionReason = rejectionReason;

    await project.save();

    // Update bid in separate collection
    await Bid.findOneAndUpdate(
      { project: projectId, freelancer: bid.freelancer },
      {
        status: "Rejected",
        rejectionReason,
      }
    );

    // Notify freelancer about bid rejection
    try {
      // Get freelancer user ID
      const freelancerDoc = await Freelancer.findById(bid.freelancer).populate(
        "user"
      );
      if (freelancerDoc && freelancerDoc.user) {
        await notificationService.notifyFreelancerBidRejected(
          freelancerDoc.user._id,
          req.user._id,
          project._id,
          project.title,
          rejectionReason
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending bid rejection notification:",
        notificationError
      );
      // Continue even if notification fails
    }

    console.log(`Bid rejected for project: ${project.title}`);

    res.status(200).json({
      success: true,
      message: "Bid rejected successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw a bid
 * @route PUT /api/projects/:projectId/bids/withdraw
 * @access Private (Freelancer only)
 */
const withdrawBid = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found",
      });
    }

    // Find project
    let project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Find bid
    const bid = project.bids.find(
      (b) => b.freelancer.toString() === freelancer._id.toString()
    );

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if bid can be withdrawn
    if (bid.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "This bid cannot be withdrawn",
      });
    }

    // Update bid status
    bid.status = "Withdrawn";

    await project.save();

    // Update bid in separate collection
    await Bid.findOneAndUpdate(
      { project: projectId, freelancer: freelancer._id },
      { status: "Withdrawn" }
    );

    // Notify client
    // In a real app, you would send a notification
    console.log(`Bid withdrawn for project: ${project.title}`);

    res.status(200).json({
      success: true,
      message: "Bid withdrawn successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Counter offer on a bid
 * @route PUT /api/projects/:projectId/bids/:bidId/counter
 * @access Private (Project owner only)
 */
const counterOffer = async (req, res, next) => {
  try {
    const { projectId, bidId } = req.params;
    const { amount, deliveryTime, message } = req.body;

    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    // Find project
    let project = await Project.findById(projectId).populate({
      path: "bids.freelancer",
      select: "user",
      populate: {
        path: "user",
        select: "name email",
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is the project owner
    if (!project.client.equals(client._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to counter bids for this project",
      });
    }

    // Find bid
    const bid = project.bids.id(bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if bid can be countered
    if (bid.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "This bid cannot be countered",
      });
    }

    console.log("Creating counter offer:", { amount, deliveryTime, message });

    // Update bid status and counter offer
    bid.status = "Countered";
    bid.counterOffer = {
      amount,
      deliveryTime,
      message,
      date: new Date(),
    };

    // Save the project with the updated bid
    await project.save();

    // Double-check that the counter offer was saved correctly
    const updatedProject = await Project.findById(projectId);
    const updatedBid = updatedProject.bids.id(bidId);

    if (!updatedBid.counterOffer) {
      console.error("Counter offer was not saved correctly to the project");
    } else {
      console.log(
        "Counter offer saved successfully to project:",
        updatedBid.counterOffer
      );
    }

    // Update bid in separate collection
    await Bid.findOneAndUpdate(
      { project: projectId, freelancer: bid.freelancer },
      {
        status: "Countered",
        counterOffer: {
          amount,
          deliveryTime,
          message,
          date: new Date(),
        },
      }
    );

    // Notify freelancer about counter offer
    try {
      // Get freelancer user ID
      const freelancerDoc = await Freelancer.findById(bid.freelancer).populate(
        "user"
      );

      if (freelancerDoc && freelancerDoc.user) {
        // Create notification in database
        await notificationService.createNotification({
          recipient: freelancerDoc.user._id,
          sender: req.user._id,
          type: "bid_countered", // Custom type not in config
          title: "Counter Offer Received",
          message: `You have received a counter offer of $${amount} for project "${project.title}"`,
          relatedProject: project._id,
          actionLink: `/freelancer/projects/${project._id}`,
        });

        // Get client name for the notification
        const clientUser = await User.findById(req.user._id);
        const clientName = clientUser ? clientUser.name : "A client";

        // Emit socket event for real-time notification
        if (req.io) {
          console.log(
            `Emitting counter offer socket event to freelancer ${freelancerDoc.user._id}`
          );

          req.io.emit("counterOffer", {
            projectId: project._id,
            bidId: bid._id,
            freelancerId: freelancerDoc.user._id,
            counterOffer: {
              amount,
              deliveryTime,
              message,
              date: new Date(),
            },
            clientId: req.user._id,
            clientName: clientName,
          });
        } else {
          console.log("Socket.io instance not available in request");
        }
      }
    } catch (notificationError) {
      console.error(
        "Error sending counter offer notification:",
        notificationError
      );
      // Continue even if notification fails
    }

    console.log(`Counter offer made for project: ${project.title}`);

    // Get the updated bid with populated freelancer data
    const populatedBid = await Bid.findOne({
      project: projectId,
      freelancer: bid.freelancer,
    }).populate({
      path: "freelancer",
      select: "user",
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    });

    console.log("Sending response with updated bid:", populatedBid);

    res.status(200).json({
      success: true,
      message: "Counter offer made successfully",
      data: {
        project,
        bid: {
          ...populatedBid.toObject(),
          status: "Countered",
          counterOffer: {
            amount,
            deliveryTime,
            message,
            date: new Date(),
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept counter offer
 * @route PUT /api/projects/:projectId/bids/:bidId/counter/accept
 * @access Private (Freelancer only)
 */
const acceptCounterOffer = async (req, res, next) => {
  try {
    const { projectId, bidId } = req.params;
    const { amount, deliveryTime } = req.body;

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found",
      });
    }

    // Find project
    let project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Find bid
    const bid = project.bids.id(bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if bid belongs to the freelancer
    if (!bid.freelancer.equals(freelancer._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this counter offer",
      });
    }

    // Check if bid has a counter offer
    if (bid.status !== "Countered" || !bid.counterOffer) {
      return res.status(400).json({
        success: false,
        message: "This bid does not have a counter offer to accept",
      });
    }

    // Update bid with counter offer values
    bid.amount = amount || bid.counterOffer.amount;
    bid.deliveryTime = deliveryTime || bid.counterOffer.deliveryTime;
    bid.status = "Pending"; // Reset to pending for client to accept

    await project.save();

    // Update bid in separate collection
    await Bid.findOneAndUpdate(
      { project: projectId, freelancer: freelancer._id },
      {
        amount: amount || bid.counterOffer.amount,
        deliveryTime: deliveryTime || bid.counterOffer.deliveryTime,
        status: "Pending",
        counterOfferAccepted: true,
      }
    );

    // Notify client about counter offer acceptance
    try {
      // Get client user ID
      const clientDoc = await Client.findById(project.client).populate("user");
      if (clientDoc && clientDoc.user) {
        await notificationService.createNotification({
          recipient: clientDoc.user._id,
          sender: req.user._id,
          type: "counter_offer_accepted",
          title: "Counter Offer Accepted",
          message: `Your counter offer for project "${project.title}" has been accepted`,
          relatedProject: project._id,
          actionLink: `/client/projects/${project._id}`,
        });
      }
    } catch (notificationError) {
      console.error(
        "Error sending counter offer acceptance notification:",
        notificationError
      );
      // Continue even if notification fails
    }

    console.log(`Counter offer accepted for project: ${project.title}`);

    res.status(200).json({
      success: true,
      message: "Counter offer accepted successfully",
      data: {
        bid,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject counter offer
 * @route PUT /api/projects/:projectId/bids/:bidId/counter/reject
 * @access Private (Freelancer only)
 */
const rejectCounterOffer = async (req, res, next) => {
  try {
    const { projectId, bidId } = req.params;

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found",
      });
    }

    // Find project
    let project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Find bid
    const bid = project.bids.id(bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if bid belongs to the freelancer
    if (!bid.freelancer.equals(freelancer._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this counter offer",
      });
    }

    // Check if bid has a counter offer
    if (bid.status !== "Countered" || !bid.counterOffer) {
      return res.status(400).json({
        success: false,
        message: "This bid does not have a counter offer to reject",
      });
    }

    // Update bid status back to pending
    bid.status = "Pending";

    await project.save();

    // Update bid in separate collection
    await Bid.findOneAndUpdate(
      { project: projectId, freelancer: freelancer._id },
      {
        status: "Pending",
        counterOfferRejected: true,
      }
    );

    // Notify client about counter offer rejection
    try {
      // Get client user ID
      const clientDoc = await Client.findById(project.client).populate("user");
      if (clientDoc && clientDoc.user) {
        await notificationService.createNotification({
          recipient: clientDoc.user._id,
          sender: req.user._id,
          type: "counter_offer_rejected",
          title: "Counter Offer Rejected",
          message: `Your counter offer for project "${project.title}" has been rejected`,
          relatedProject: project._id,
          actionLink: `/client/projects/${project._id}`,
        });
      }
    } catch (notificationError) {
      console.error(
        "Error sending counter offer rejection notification:",
        notificationError
      );
      // Continue even if notification fails
    }

    console.log(`Counter offer rejected for project: ${project.title}`);

    res.status(200).json({
      success: true,
      message: "Counter offer rejected successfully",
      data: {
        bid,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent bids for client projects
 * @route GET /api/projects/client/recent-bids
 * @access Private (Client only)
 */
const getClientRecentBids = async (req, res, next) => {
  try {
    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    // Get client's projects
    const projects = await Project.find({ client: client._id });
    const projectIds = projects.map((project) => project._id);

    // Get recent bids for these projects
    const bids = await Bid.find({ project: { $in: projectIds } })
      .populate({
        path: "freelancer",
        select: "user skills hourlyRate averageRating",
        populate: {
          path: "user",
          select: "name profileImage",
        },
      })
      .populate("project", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        bids,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitBid,
  getProjectBids,
  getFreelancerBids,
  acceptBid,
  rejectBid,
  withdrawBid,
  counterOffer,
  acceptCounterOffer,
  rejectCounterOffer,
  getClientRecentBids,
};
