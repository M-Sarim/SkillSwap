const TimeTracking = require('../../models/TimeTracking');
const Project = require('../../models/Project');
const Freelancer = require('../../models/Freelancer');

/**
 * Get time tracking for a project
 * @route GET /api/projects/:projectId/time-tracking
 * @access Private (Freelancer or Client)
 */
const getTimeTracking = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // Get project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is authorized to view time tracking
    const isClient = project.client.toString() === req.user._id.toString();
    let isFreelancer = false;
    
    if (!isClient) {
      // Check if user is the assigned freelancer
      const freelancer = await Freelancer.findOne({ user: req.user._id });
      
      if (!freelancer) {
        return res.status(404).json({
          success: false,
          message: 'Freelancer profile not found'
        });
      }
      
      isFreelancer = project.freelancer && project.freelancer.toString() === freelancer._id.toString();
      
      if (!isFreelancer) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view time tracking for this project'
        });
      }
    }
    
    // Get time tracking
    let timeTracking;
    
    if (isFreelancer) {
      const freelancer = await Freelancer.findOne({ user: req.user._id });
      timeTracking = await TimeTracking.getTimeTracking(projectId, freelancer._id);
    } else {
      // For clients, get all time tracking for the project
      timeTracking = await TimeTracking.find({ project: projectId })
        .populate({
          path: 'freelancer',
          select: 'user',
          populate: {
            path: 'user',
            select: 'name profileImage'
          }
        });
    }
    
    res.status(200).json({
      success: true,
      data: {
        timeTracking
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a time tracking session
 * @route POST /api/projects/:projectId/time-tracking
 * @access Private (Freelancer only)
 */
const addTimeTrackingSession = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { startTime, endTime, duration, notes } = req.body;
    
    // Validate input
    if (!startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Start time, end time, and duration are required'
      });
    }
    
    // Get project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });
    
    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }
    
    // Check if freelancer is assigned to this project
    if (!project.freelancer || project.freelancer.toString() !== freelancer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this project'
      });
    }
    
    // Check if project is hourly
    if (project.paymentType !== 'Hourly') {
      return res.status(400).json({
        success: false,
        message: 'Time tracking is only available for hourly projects'
      });
    }
    
    // Get or create time tracking
    const timeTracking = await TimeTracking.getTimeTracking(projectId, freelancer._id);
    
    // Add session
    const session = {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      notes
    };
    
    await timeTracking.addSession(session);
    
    res.status(201).json({
      success: true,
      message: 'Time tracking session added successfully',
      data: {
        timeTracking
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimeTracking,
  addTimeTrackingSession
};
