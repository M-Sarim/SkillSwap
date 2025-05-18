const User = require('../models/User');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');

/**
 * Middleware to check if user is a client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isClient = async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients can access this route.'
      });
    }
    
    const client = await Client.findOne({ user: req.user._id });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }
    
    req.client = client;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is a freelancer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isFreelancer = async (req, res, next) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only freelancers can access this route.'
      });
    }
    
    const freelancer = await Freelancer.findOne({ user: req.user._id });
    
    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }
    
    req.freelancer = freelancer;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can access this route.'
    });
  }
  
  next();
};

/**
 * Middleware to check if user is a verified freelancer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isVerifiedFreelancer = async (req, res, next) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only freelancers can access this route.'
      });
    }
    
    const freelancer = await Freelancer.findOne({ user: req.user._id });
    
    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }
    
    if (!freelancer.verified) {
      return res.status(403).json({
        success: false,
        message: 'Your account needs to be verified to access this feature'
      });
    }
    
    req.freelancer = freelancer;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is the project owner
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isProjectOwner = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is the client who created the project
    const client = await Client.findOne({ user: req.user._id });
    
    if (!client || !project.client.equals(client._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this project.'
      });
    }
    
    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isClient,
  isFreelancer,
  isAdmin,
  isVerifiedFreelancer,
  isProjectOwner
};
