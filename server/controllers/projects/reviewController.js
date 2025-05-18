const Project = require("../../models/Project");
const Client = require("../../models/Client");
const Freelancer = require("../../models/Freelancer");
const Notification = require("../../models/Notification");
const config = require("../../utils/config");

/**
 * Add a review for a freelancer
 * @route POST /api/projects/:projectId/reviews
 * @access Private (Client only)
 */
const addFreelancerReview = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { rating, comment } = req.body;

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
        message: "You are not authorized to review this project",
      });
    }

    // Check if project is completed
    if (project.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "You can only review completed projects",
      });
    }

    // Get freelancer
    const freelancer = await Freelancer.findById(project.freelancer);

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
      });
    }

    // Check for existing review
    const existingReview = freelancer.ratings.find(
      (r) =>
        r.client.toString() === client._id.toString() &&
        r.project.toString() === project._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this project",
      });
    }

    // Add review
    freelancer.ratings.push({
      client: client._id,
      project: project._id,
      rating,
      comment,
      date: new Date(),
    });

    await freelancer.save();

    // Send notification to freelancer
    await Notification.create({
      recipient: freelancer.user,
      type: "REVIEW",
      message: `${client.user.name} left you a ${rating}-star review`,
      reference: {
        type: "Review",
        id: freelancer.ratings[freelancer.ratings.length - 1]._id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: {
        review: freelancer.ratings[freelancer.ratings.length - 1],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a review for a client
 * @route POST /api/projects/:projectId/reviews/client
 * @access Private (Freelancer only)
 */
const addClientReview = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { rating, comment } = req.body;

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found",
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

    // Check if user is the assigned freelancer
    if (!project.freelancer || !project.freelancer.equals(freelancer._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to review this project",
      });
    }

    // Check if project is completed
    if (project.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "You can only review completed projects",
      });
    }

    // Get client
    const client = await Client.findById(project.client);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Check if freelancer has already reviewed this project
    const existingReview = client.ratings.find(
      (r) =>
        r.freelancer.toString() === freelancer._id.toString() &&
        r.project.toString() === project._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this project",
      });
    }

    // Add review
    client.ratings.push({
      freelancer: freelancer._id,
      project: project._id,
      rating,
      comment,
      date: new Date(),
    });

    await client.save();

    // Notify client
    // In a real app, you would send a notification
    console.log(`New review for client on project: ${project.title}`);

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: {
        review: client.ratings[client.ratings.length - 1],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get freelancer reviews with filtering and sorting
 * @route GET /api/freelancers/:freelancerId/reviews
 * @access Public
 */
const getFreelancerReviews = async (req, res, next) => {
  try {
    const { freelancerId } = req.params;
    const {
      sort = "date",
      rating,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    // Get freelancer with populated reviews
    const freelancer = await Freelancer.findById(freelancerId)
      .populate({
        path: "ratings.client",
        select: "user",
        populate: {
          path: "user",
          select: "name profileImage",
        },
      })
      .populate("ratings.project", "title");

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
      });
    }

    // Filter reviews
    let reviews = freelancer.ratings;

    if (rating) {
      reviews = reviews.filter((r) => r.rating === parseInt(rating));
    }

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      reviews = reviews.filter((r) => {
        const reviewDate = new Date(r.date);
        return reviewDate >= start && reviewDate <= end;
      });
    }

    // Sort reviews
    switch (sort) {
      case "date":
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "rating":
        reviews.sort((a, b) => b.rating - a.rating);
        break;
      case "oldest":
        reviews.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      default:
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Calculate statistics
    const stats = {
      total: reviews.length,
      average: freelancer.averageRating,
      distribution: {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      },
    };

    // Paginate reviews
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = reviews.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        reviews: paginatedReviews,
        stats,
        pagination: {
          total: reviews.length,
          totalPages: Math.ceil(reviews.length / limit),
          currentPage: page,
          hasMore: endIndex < reviews.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client reviews
 * @route GET /api/clients/:clientId/reviews
 * @access Public
 */
const getClientReviews = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { sort = "date", rating, page = 1, limit = 10 } = req.query;

    // Get client
    const client = await Client.findById(clientId)
      .populate({
        path: "ratings.freelancer",
        select: "user",
        populate: {
          path: "user",
          select: "name profileImage",
        },
      })
      .populate("ratings.project", "title");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Filter reviews
    let reviews = client.ratings;

    if (rating) {
      reviews = reviews.filter((r) => r.rating === parseInt(rating));
    }

    // Sort reviews
    if (sort === "date") {
      reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === "rating") {
      reviews.sort((a, b) => b.rating - a.rating);
    }

    // Paginate reviews
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = reviews.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        reviews: paginatedReviews,
        totalReviews: reviews.length,
        totalPages: Math.ceil(reviews.length / limit),
        currentPage: page,
        averageRating: client.averageRating,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Respond to a review
 * @route PUT /api/reviews/:reviewId/respond
 * @access Private (Freelancer only)
 */
const respondToReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;

    // Get freelancer
    const freelancer = await Freelancer.findOne({
      user: req.user._id,
    }).populate("ratings.client", "user");

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found",
      });
    }

    // Find the review
    const review = freelancer.ratings.id(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if already responded
    if (review.response) {
      return res.status(400).json({
        success: false,
        message: "You have already responded to this review",
      });
    }

    // Add response
    review.response = response;
    review.responseDate = new Date();

    await freelancer.save();

    // Notify client
    await Notification.create({
      recipient: review.client.user,
      type: "REVIEW_RESPONSE",
      message: `${req.user.name} responded to your review`,
      reference: {
        type: "Review",
        id: reviewId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Response added successfully",
      data: {
        review,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFreelancerReview,
  addClientReview,
  getFreelancerReviews,
  getClientReviews,
  respondToReview,
};
