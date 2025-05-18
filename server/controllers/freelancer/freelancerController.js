const Freelancer = require('../../models/Freelancer');
const User = require('../../models/User');
const Bid = require('../../models/Bid');
const Project = require('../../models/Project');

/**
 * Get freelancer profile
 * @route GET /api/freelancer/profile
 * @access Private (Freelancer only)
 */
const getFreelancerProfile = async (req, res, next) => {
  try {
    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        freelancer
      }
    });
  } catch (error) {
    console.error('Error getting freelancer profile:', error);
    next(error);
  }
};

/**
 * Update freelancer profile
 * @route PUT /api/freelancer/profile
 * @access Private (Freelancer only)
 */
const updateFreelancerProfile = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      bio,
      skills,
      hourlyRate,
      portfolio,
      education,
      experience,
      profileImage
    } = req.body;

    // Get freelancer
    let freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    // Update user info
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;
    
    await user.save();

    // Update freelancer info
    if (bio) freelancer.bio = bio;
    if (skills) freelancer.skills = skills;
    if (hourlyRate) freelancer.hourlyRate = hourlyRate;
    if (portfolio) freelancer.portfolio = portfolio;
    if (education) freelancer.education = education;
    if (experience) freelancer.experience = experience;

    await freelancer.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
        freelancer
      }
    });
  } catch (error) {
    console.error('Error updating freelancer profile:', error);
    next(error);
  }
};

/**
 * Get freelancer analytics
 * @route GET /api/freelancer/analytics
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
    
    // Get bids
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

module.exports = {
  getFreelancerProfile,
  updateFreelancerProfile,
  getFreelancerAnalytics
};
