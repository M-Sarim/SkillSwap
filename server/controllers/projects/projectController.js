const Project = require('../../models/Project');
const Client = require('../../models/Client');
const Freelancer = require('../../models/Freelancer');
const Notification = require('../../models/Notification');
const config = require('../../utils/config');

/**
 * Create a new project
 * @route POST /api/projects
 * @access Private (Client only)
 */
const createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      skills,
      budget,
      deadline,
      paymentType,
      attachments
    } = req.body;

    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Create project
    const project = await Project.create({
      title,
      description,
      client: client._id,
      category,
      skills,
      budget,
      deadline: new Date(deadline),
      paymentType,
      attachments: attachments || [],
      status: 'Open'
    });

    // Add project to client's projects
    client.projects.push(project._id);
    client.activeProjects += 1;
    await client.save();

    // Notify freelancers with matching skills (in a real app)
    // For now, we'll just log it
    console.log(`New project created: ${title}`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects
 * @route GET /api/projects
 * @access Public
 */
const getAllProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      skills,
      budget_min,
      budget_max,
      status,
      sort = 'createdAt'
    } = req.query;

    // Build query
    const query = { isPublic: true };

    if (category) {
      query.category = category;
    }

    if (skills) {
      const skillsArray = skills.split(',');
      query.skills = { $in: skillsArray };
    }

    if (budget_min || budget_max) {
      query.budget = {};

      if (budget_min) {
        query.budget.$gte = Number(budget_min);
      }

      if (budget_max) {
        query.budget.$lte = Number(budget_max);
      }
    }

    if (status) {
      query.status = status;
    }

    // Execute query
    const projects = await Project.find(query)
      .populate('client', 'company')
      .sort({ [sort]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const count = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        projects,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalProjects: count
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project by ID
 * @route GET /api/projects/:id
 * @access Public
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('client', 'company')
      .populate('freelancer', 'user skills hourlyRate averageRating')
      .populate({
        path: 'bids.freelancer',
        select: 'user skills hourlyRate averageRating',
        populate: {
          path: 'user',
          select: 'name profileImage'
        }
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Increment view count
    project.views += 1;
    await project.save();

    res.status(200).json({
      success: true,
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project
 * @route PUT /api/projects/:id
 * @access Private (Project owner only)
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      skills,
      budget,
      deadline,
      paymentType,
      attachments,
      status
    } = req.body;

    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Find project
    let project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is the project owner
    if (!project.client.equals(client._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this project'
      });
    }

    // Check if project can be updated
    if (project.status === 'Completed' || project.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a completed or cancelled project'
      });
    }

    // Update project
    project = await Project.findByIdAndUpdate(
      id,
      {
        title,
        description,
        category,
        skills,
        budget,
        deadline: deadline ? new Date(deadline) : project.deadline,
        paymentType,
        attachments,
        status
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete project
 * @route DELETE /api/projects/:id
 * @access Private (Project owner only)
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Find project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is the project owner
    if (!project.client.equals(client._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this project'
      });
    }

    // Check if project can be deleted
    if (project.status === 'In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a project that is in progress'
      });
    }

    // Delete project - using deleteOne() instead of remove() which is deprecated in Mongoose 7+
    await Project.deleteOne({ _id: project._id });

    // Update client's projects
    client.projects = client.projects.filter(
      projectId => !projectId.equals(project._id)
    );

    if (project.status === 'Open') {
      client.activeProjects -= 1;
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client's projects
 * @route GET /api/projects/client
 * @access Private (Client only)
 */
const getClientProjects = async (req, res, next) => {
  try {
    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Get projects
    const projects = await Project.find({ client: client._id })
      .populate('freelancer', 'user skills hourlyRate averageRating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        projects
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get freelancer's projects
 * @route GET /api/projects/freelancer
 * @access Private (Freelancer only)
 */
const getFreelancerProjects = async (req, res, next) => {
  try {
    console.log('Getting projects for freelancer user:', req.user._id);

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      console.log('Freelancer profile not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    console.log('Found freelancer profile:', freelancer._id);

    // Get projects
    const projects = await Project.find({ freelancer: freelancer._id })
      .populate('client', 'company')
      .sort({ createdAt: -1 });

    console.log('Found projects for freelancer:', projects.length);

    // Log each project for debugging
    if (projects.length > 0) {
      projects.forEach(project => {
        console.log(`Project: ${project._id}, Title: ${project.title}, Status: ${project.status}`);
      });
    } else {
      // If no projects found, double check with a more direct query
      console.log('No projects found, checking with direct query...');
      const allProjects = await Project.find({ status: 'In Progress' });
      console.log(`Found ${allProjects.length} in-progress projects in total`);

      allProjects.forEach(project => {
        console.log(`Project: ${project._id}, Freelancer: ${project.freelancer}, Title: ${project.title}`);

        // Check if this freelancer should be assigned to any of these projects
        if (project.freelancer && project.freelancer.toString() === freelancer._id.toString()) {
          console.log(`Found a project that should be assigned to this freelancer: ${project._id}`);
          projects.push(project);
        }
      });
    }

    // Make sure we're returning the updated list of projects
    const finalProjects = projects.length > 0 ? projects : await Project.find({ freelancer: freelancer._id });

    console.log(`Returning ${finalProjects.length} projects to the freelancer`);

    res.status(200).json({
      success: true,
      data: {
        projects: finalProjects
      }
    });
  } catch (error) {
    console.error('Error getting freelancer projects:', error);
    next(error);
  }
};

/**
 * Add milestone to project
 * @route POST /api/projects/:id/milestones
 * @access Private (Project owner only)
 */
const addMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, amount } = req.body;

    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Find project
    let project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is the project owner
    if (!project.client.equals(client._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this project'
      });
    }

    // Add milestone
    project.milestones.push({
      title,
      description,
      dueDate: new Date(dueDate),
      amount,
      status: 'Pending'
    });

    await project.save();

    // Notify freelancer if assigned
    if (project.freelancer) {
      // In a real app, you would send a notification
      console.log(`New milestone added to project: ${project.title}`);
    }

    res.status(200).json({
      success: true,
      message: 'Milestone added successfully',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update milestone status
 * @route PUT /api/projects/:id/milestones/:milestoneId
 * @access Private (Project owner or assigned freelancer)
 */
const updateMilestoneStatus = async (req, res, next) => {
  try {
    const { id, milestoneId } = req.params;
    const { status, feedback } = req.body;

    // Find project
    let project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find milestone
    const milestone = project.milestones.id(milestoneId);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client') {
      // Client can only approve or reject
      const client = await Client.findOne({ user: req.user._id });

      if (!client || !project.client.equals(client._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this milestone'
        });
      }

      if (status !== 'Approved' && status !== 'Rejected') {
        return res.status(400).json({
          success: false,
          message: 'Clients can only approve or reject milestones'
        });
      }

      milestone.status = status;
      milestone.feedback = feedback;

      if (status === 'Approved') {
        milestone.completionDate = new Date();
      }
    } else if (req.user.role === 'freelancer') {
      // Freelancer can only mark as completed
      const freelancer = await Freelancer.findOne({ user: req.user._id });

      if (!freelancer || !project.freelancer.equals(freelancer._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this milestone'
        });
      }

      if (status !== 'Completed') {
        return res.status(400).json({
          success: false,
          message: 'Freelancers can only mark milestones as completed'
        });
      }

      milestone.status = 'Completed';
    } else {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this milestone'
      });
    }

    await project.save();

    // Update project progress
    project.progress = project.calculateProgress();
    await project.save();

    // Notify the other party
    // In a real app, you would send a notification
    console.log(`Milestone status updated: ${milestone.title}`);

    res.status(200).json({
      success: true,
      message: 'Milestone status updated successfully',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client stats
 * @route GET /api/projects/client/stats
 * @access Private (Client only)
 */
const getClientStats = async (req, res, next) => {
  try {
    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Get projects
    const projects = await Project.find({ client: client._id });

    // Calculate stats
    const activeProjects = projects.filter(p => p.status === 'Open' || p.status === 'In Progress').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    // Calculate total spent
    const totalSpent = projects
      .filter(p => p.status === 'Completed')
      .reduce((total, project) => total + project.budget, 0);

    // Count active bids
    const activeBids = projects
      .filter(p => p.status === 'Open')
      .reduce((total, project) => total + (project.bids ? project.bids.length : 0), 0);

    res.status(200).json({
      success: true,
      data: {
        activeProjects,
        completedProjects,
        totalSpent,
        activeBids
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client analytics
 * @route GET /api/projects/client/analytics
 * @access Private (Client only)
 */
const getClientAnalytics = async (req, res, next) => {
  try {
    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Get projects
    const projects = await Project.find({ client: client._id });

    // Calculate project stats by month
    const projectsByMonth = {};
    const spendingByMonth = {};
    const categoryCounts = {};

    // Get current date and 6 months ago
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Initialize months
    for (let i = 0; i <= 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      projectsByMonth[monthYear] = 0;
      spendingByMonth[monthYear] = 0;
    }

    // Process projects
    projects.forEach(project => {
      // Count projects by month
      const createdAt = new Date(project.createdAt);
      if (createdAt >= sixMonthsAgo) {
        const monthYear = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (projectsByMonth[monthYear] !== undefined) {
          projectsByMonth[monthYear]++;
        }
      }

      // Count spending by month for completed projects
      if (project.status === 'Completed') {
        const completedAt = project.completedAt || project.updatedAt;
        const completionDate = new Date(completedAt);
        if (completionDate >= sixMonthsAgo) {
          const monthYear = completionDate.toLocaleString('default', { month: 'short', year: 'numeric' });
          if (spendingByMonth[monthYear] !== undefined) {
            spendingByMonth[monthYear] += project.budget;
          }
        }
      }

      // Count projects by category
      if (project.category) {
        categoryCounts[project.category] = (categoryCounts[project.category] || 0) + 1;
      }
    });

    // Convert to arrays for chart data
    const projectStatsLabels = Object.keys(projectsByMonth).reverse();
    const projectStatsData = projectStatsLabels.map(month => projectsByMonth[month]);

    const spendingStatsLabels = Object.keys(spendingByMonth).reverse();
    const spendingStatsData = spendingStatsLabels.map(month => spendingByMonth[month]);

    // Get top 5 categories
    const categoryEntries = Object.entries(categoryCounts);
    categoryEntries.sort((a, b) => b[1] - a[1]);
    const topCategories = categoryEntries.slice(0, 5);

    const categoryStatsLabels = topCategories.map(entry => entry[0]);
    const categoryStatsData = topCategories.map(entry => entry[1]);

    // Calculate completion rate
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    // Prepare response
    const analyticsData = {
      projectStats: {
        labels: projectStatsLabels,
        data: projectStatsData
      },
      spendingStats: {
        labels: spendingStatsLabels,
        data: spendingStatsData
      },
      categoryStats: {
        labels: categoryStatsLabels,
        data: categoryStatsData
      },
      completionRate
    };

    res.status(200).json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get freelancer stats
 * @route GET /api/projects/freelancer/stats
 * @access Private (Freelancer only)
 */
const getFreelancerStats = async (req, res, next) => {
  try {
    console.log('Getting stats for freelancer user:', req.user._id);

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      console.log('Freelancer profile not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    console.log('Found freelancer profile:', freelancer._id);

    // Get projects
    const projects = await Project.find({ freelancer: freelancer._id });

    // Calculate stats
    const activeProjects = projects.filter(p => p.status === 'In Progress').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    // Calculate total earnings
    const totalEarnings = projects
      .filter(p => p.status === 'Completed')
      .reduce((total, project) => total + project.budget, 0);

    // Get average rating
    const averageRating = freelancer.averageRating || 0;

    res.status(200).json({
      success: true,
      data: {
        activeProjects,
        completedProjects,
        totalEarnings,
        averageRating
      }
    });
  } catch (error) {
    console.error('Error getting freelancer stats:', error);
    next(error);
  }
};

/**
 * Get freelancer analytics
 * @route GET /api/projects/freelancer/analytics
 * @access Private (Freelancer only)
 */
const getFreelancerAnalytics = async (req, res, next) => {
  try {
    console.log('Getting analytics for freelancer user:', req.user._id);
    const { dateRange } = req.query;

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      console.log('Freelancer profile not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    console.log('Found freelancer profile:', freelancer._id);

    // Get projects
    const projects = await Project.find({ freelancer: freelancer._id });

    // Get bids (assuming there's a Bid model)
    const Bid = require('../../models/Bid');
    const bids = await Bid.find({ freelancer: freelancer._id });

    // Calculate earnings stats by month
    const earningsByMonth = {};
    const projectsByMonth = {};
    const bidStatusCounts = {};
    const skillDemand = {};

    // Get current date and 6 months ago
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Initialize months
    for (let i = 0; i <= 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      earningsByMonth[monthYear] = 0;
      projectsByMonth[monthYear] = 0;
    }

    // Process projects for earnings and project counts
    projects.forEach(project => {
      // Count completed projects by month
      if (project.status === 'Completed' && project.completionDate) {
        const completionDate = new Date(project.completionDate);
        if (completionDate >= sixMonthsAgo) {
          const monthYear = completionDate.toLocaleString('default', { month: 'short', year: 'numeric' });
          if (earningsByMonth[monthYear] !== undefined) {
            earningsByMonth[monthYear] += project.budget;
          }
        }
      }

      // Count projects by month
      const createdAt = new Date(project.createdAt);
      if (createdAt >= sixMonthsAgo) {
        const monthYear = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (projectsByMonth[monthYear] !== undefined) {
          projectsByMonth[monthYear]++;
        }
      }

      // Count skills in demand
      if (project.skills && project.skills.length > 0) {
        project.skills.forEach(skill => {
          skillDemand[skill] = (skillDemand[skill] || 0) + 1;
        });
      }
    });

    // Process bids for bid status distribution
    if (bids && bids.length > 0) {
      bids.forEach(bid => {
        const status = bid.status || 'Pending';
        bidStatusCounts[status] = (bidStatusCounts[status] || 0) + 1;
      });
    } else {
      // Mock data if no bids
      bidStatusCounts['Accepted'] = 12;
      bidStatusCounts['Rejected'] = 8;
      bidStatusCounts['Pending'] = 8;
    }

    // Convert to arrays for chart data
    const earningsStatsLabels = Object.keys(earningsByMonth).reverse();
    const earningsStatsData = earningsStatsLabels.map(month => earningsByMonth[month]);

    const projectStatsLabels = Object.keys(projectsByMonth).reverse();
    const projectStatsData = projectStatsLabels.map(month => projectsByMonth[month]);

    // Get bid status distribution
    const bidStatsLabels = Object.keys(bidStatusCounts);
    const bidStatsData = bidStatsLabels.map(status => bidStatusCounts[status]);

    // Get top 5 skills in demand
    const skillEntries = Object.entries(skillDemand);
    skillEntries.sort((a, b) => b[1] - a[1]);
    const topSkills = skillEntries.slice(0, 5);

    const skillStatsLabels = topSkills.map(entry => entry[0]);
    const skillStatsData = topSkills.map(entry => entry[1]);

    // Calculate stats
    const totalBids = bids ? bids.length : 28;
    const acceptedBids = bids ? bids.filter(b => b.status === 'Accepted').length : 12;
    const bidSuccessRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 43;

    // Get average rating and review count
    const averageRating = freelancer.averageRating || 4.5;
    const reviewCount = freelancer.ratings ? freelancer.ratings.length : 18;

    // Response rate and on-time rate (mock data for now)
    const responseRate = 92;
    const onTimeRate = 88;

    // Prepare response
    const analyticsData = {
      earningsStats: {
        labels: earningsStatsLabels,
        data: earningsStatsData
      },
      projectStats: {
        labels: projectStatsLabels,
        data: projectStatsData
      },
      bidStats: {
        labels: bidStatsLabels,
        data: bidStatsData
      },
      skillStats: {
        labels: skillStatsLabels,
        data: skillStatsData
      },
      stats: {
        bidSuccessRate,
        acceptedBids,
        totalBids,
        averageRating,
        reviewCount,
        responseRate,
        onTimeRate
      }
    };

    res.status(200).json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error getting freelancer analytics:', error);
    next(error);
  }
};

/**
 * Mark project as complete (freelancer)
 * @route PUT /api/projects/:id/complete
 * @access Private (Assigned freelancer only)
 */
const completeProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Marking project as complete:', id);
    console.log('User ID:', req.user._id);

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      console.log('Freelancer profile not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    console.log('Found freelancer profile:', freelancer._id);

    // Find project
    const project = await Project.findById(id);

    if (!project) {
      console.log('Project not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('Found project:', project._id);
    console.log('Project freelancer:', project.freelancer);
    console.log('Current freelancer:', freelancer._id);

    // Check if user is the assigned freelancer
    if (!project.freelancer || !project.freelancer.equals(freelancer._id)) {
      console.log('User is not the assigned freelancer');
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this project'
      });
    }

    // Check if project can be completed
    if (project.status !== 'In Progress') {
      console.log('Project is not in progress, current status:', project.status);
      return res.status(400).json({
        success: false,
        message: 'Only in-progress projects can be marked as complete'
      });
    }

    // Update project status
    project.status = 'Completed';
    project.completionDate = new Date();
    await project.save();

    console.log('Project marked as complete:', project._id);

    // Notify client
    // In a real app, you would send a notification
    console.log(`Project completed: ${project.title}`);

    res.status(200).json({
      success: true,
      message: 'Project marked as complete successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Error completing project:', error);
    next(error);
  }
};

/**
 * Update project progress
 * @route PUT /api/projects/:id/progress
 * @access Private (Project owner or assigned freelancer)
 */
const updateProjectProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    // Find project
    let project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client') {
      // Client must be the project owner
      const client = await Client.findOne({ user: req.user._id });

      if (!client || !project.client.equals(client._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this project'
        });
      }
    } else if (req.user.role === 'freelancer') {
      // Freelancer must be assigned to the project
      const freelancer = await Freelancer.findOne({ user: req.user._id });

      if (!freelancer || !project.freelancer || !project.freelancer.equals(freelancer._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this project'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this project'
      });
    }

    // Check if project can be updated
    if (project.status === 'Completed' || project.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a completed or cancelled project'
      });
    }

    // Update project progress
    project.progress = progress;

    // If progress is 100%, update status to Completed
    if (progress === 100) {
      project.status = 'Completed';
      project.completionDate = new Date();
    } else if (progress > 0 && project.status === 'Open') {
      // If progress is greater than 0 and status is Open, update to In Progress
      project.status = 'In Progress';
      if (!project.startDate) {
        project.startDate = new Date();
      }
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project progress updated successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Error updating project progress:', error);
    next(error);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getClientProjects,
  getFreelancerProjects,
  addMilestone,
  updateMilestoneStatus,
  getClientStats,
  getClientAnalytics,
  getFreelancerStats,
  getFreelancerAnalytics,
  completeProject,
  updateProjectProgress
};
