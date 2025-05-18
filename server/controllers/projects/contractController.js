const Contract = require('../../models/Contract');
const Project = require('../../models/Project');
const Client = require('../../models/Client');
const Freelancer = require('../../models/Freelancer');
const Notification = require('../../models/Notification');
const config = require('../../utils/config');
const notificationService = require('../../utils/notificationService');

/**
 * Create a contract for a project
 * @route POST /api/projects/:projectId/contract
 * @access Private (Client only)
 */
const createContract = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      terms,
      amount,
      startDate,
      endDate,
      paymentTerms,
      deliverables
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
    const project = await Project.findById(projectId);

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
        message: 'You are not authorized to create a contract for this project'
      });
    }

    // Check if project has an assigned freelancer
    if (!project.freelancer) {
      return res.status(400).json({
        success: false,
        message: 'Project does not have an assigned freelancer'
      });
    }

    // Check if contract already exists
    if (project.contractId) {
      return res.status(400).json({
        success: false,
        message: 'Contract already exists for this project'
      });
    }

    // Create contract
    const contract = await Contract.create({
      project: project._id,
      client: client._id,
      freelancer: project.freelancer,
      title,
      description,
      terms,
      amount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      paymentTerms,
      deliverables: deliverables || [],
      status: 'Draft'
    });

    // Update project with contract ID
    project.contractId = contract._id;
    await project.save();

    // Notify freelancer about contract creation
    try {
      // Get freelancer user ID
      const freelancerDoc = await Freelancer.findById(project.freelancer).populate('user');
      if (freelancerDoc && freelancerDoc.user) {
        await notificationService.notifyContractCreated(
          freelancerDoc.user._id,
          req.user._id,
          contract._id,
          project._id,
          project.title
        );
      }
    } catch (notificationError) {
      console.error('Error sending contract creation notification:', notificationError);
      // Continue even if notification fails
    }

    console.log(`Contract created for project: ${project.title}`);

    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: {
        contract
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contract by project ID
 * @route GET /api/projects/:projectId/contract
 * @access Private (Project owner or assigned freelancer)
 */
const getContractByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    let isAuthorized = false;

    if (req.user.role === 'client') {
      const client = await Client.findOne({ user: req.user._id });
      isAuthorized = client && project.client.equals(client._id);
    } else if (req.user.role === 'freelancer') {
      const freelancer = await Freelancer.findOne({ user: req.user._id });
      isAuthorized = freelancer && project.freelancer && project.freelancer.equals(freelancer._id);
    } else if (req.user.role === 'admin') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this contract'
      });
    }

    // Check if contract exists
    if (!project.contractId) {
      return res.status(404).json({
        success: false,
        message: 'No contract exists for this project'
      });
    }

    // Get contract
    const contract = await Contract.findById(project.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        contract
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update contract
 * @route PUT /api/projects/:projectId/contract
 * @access Private (Client only)
 */
const updateContract = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      terms,
      amount,
      startDate,
      endDate,
      paymentTerms,
      deliverables,
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
    const project = await Project.findById(projectId);

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
        message: 'You are not authorized to update this contract'
      });
    }

    // Check if contract exists
    if (!project.contractId) {
      return res.status(404).json({
        success: false,
        message: 'No contract exists for this project'
      });
    }

    // Get contract
    let contract = await Contract.findById(project.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check if contract can be updated
    if (contract.status === 'Completed' || contract.status === 'Terminated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a completed or terminated contract'
      });
    }

    // Update contract
    contract = await Contract.findByIdAndUpdate(
      contract._id,
      {
        title: title || contract.title,
        description: description || contract.description,
        terms: terms || contract.terms,
        amount: amount || contract.amount,
        startDate: startDate ? new Date(startDate) : contract.startDate,
        endDate: endDate ? new Date(endDate) : contract.endDate,
        paymentTerms: paymentTerms || contract.paymentTerms,
        deliverables: deliverables || contract.deliverables,
        status: status || contract.status
      },
      { new: true, runValidators: true }
    );

    // Notify freelancer
    // In a real app, you would send a notification
    console.log(`Contract updated for project: ${project.title}`);

    res.status(200).json({
      success: true,
      message: 'Contract updated successfully',
      data: {
        contract
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign contract
 * @route PUT /api/projects/:projectId/contract/sign
 * @access Private (Project owner or assigned freelancer)
 */
const signContract = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { ipAddress } = req.body;

    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if contract exists
    if (!project.contractId) {
      return res.status(404).json({
        success: false,
        message: 'No contract exists for this project'
      });
    }

    // Get contract
    let contract = await Contract.findById(project.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check authorization and sign contract
    let recipientId = null;

    if (req.user.role === 'client') {
      const client = await Client.findOne({ user: req.user._id });

      if (!client || !project.client.equals(client._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to sign this contract'
        });
      }

      // Sign as client
      contract.clientSignature = {
        signed: true,
        date: new Date(),
        ipAddress: ipAddress || req.ip
      };

      // Get freelancer user ID for notification
      const freelancerDoc = await Freelancer.findById(project.freelancer).populate('user');
      if (freelancerDoc && freelancerDoc.user) {
        recipientId = freelancerDoc.user._id;
      }
    } else if (req.user.role === 'freelancer') {
      const freelancer = await Freelancer.findOne({ user: req.user._id });

      if (!freelancer || !project.freelancer || !project.freelancer.equals(freelancer._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to sign this contract'
        });
      }

      // Sign as freelancer
      contract.freelancerSignature = {
        signed: true,
        date: new Date(),
        ipAddress: ipAddress || req.ip
      };

      // Get client user ID for notification
      const clientDoc = await Client.findById(project.client).populate('user');
      if (clientDoc && clientDoc.user) {
        recipientId = clientDoc.user._id;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to sign this contract'
      });
    }

    // Send notification to the other party about contract signing
    if (recipientId) {
      try {
        await notificationService.notifyContractSigned(
          recipientId,
          req.user._id,
          contract._id,
          project._id,
          project.title
        );
      } catch (notificationError) {
        console.error('Error sending contract signing notification:', notificationError);
        // Continue even if notification fails
      }
    }

    await contract.save();

    // Check if both parties have signed
    if (contract.clientSignature.signed && contract.freelancerSignature.signed) {
      // Update contract status
      contract.status = 'Active';
      await contract.save();

      try {
        // Get the client and freelancer user IDs
        const freelancer = await Freelancer.findById(project.freelancer);
        const client = await Client.findById(project.client);

        if (freelancer && client) {
          const clientUserId = client.user;
          const freelancerUserId = freelancer.user;

          // Import the Message model
          const Message = require('../../models/Message');

          // Create a contract signed message
          const contractMessage = new Message({
            sender: req.user._id, // The current user who completed the signing
            receiver: req.user.role === 'client' ? freelancerUserId : clientUserId,
            content: `The contract for project "${project.title}" has been signed by both parties and is now active. Let's get started!`,
            project: project._id
          });
          await contractMessage.save();

          console.log(`Contract activation message sent from ${req.user._id} to ${req.user.role === 'client' ? freelancerUserId : clientUserId}`);
        }
      } catch (messageError) {
        console.error('Error creating contract activation message:', messageError);
        // Continue with the contract activation even if message creation fails
      }

      // Notify both parties
      // In a real app, you would send notifications
      console.log(`Contract activated for project: ${project.title}`);
    }

    res.status(200).json({
      success: true,
      message: 'Contract signed successfully',
      data: {
        contract
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate contract
 * @route PUT /api/projects/:projectId/contract/terminate
 * @access Private (Client only)
 */
const terminateContract = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { terminationReason } = req.body;

    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Find project
    const project = await Project.findById(projectId);

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
        message: 'You are not authorized to terminate this contract'
      });
    }

    // Check if contract exists
    if (!project.contractId) {
      return res.status(404).json({
        success: false,
        message: 'No contract exists for this project'
      });
    }

    // Get contract
    let contract = await Contract.findById(project.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check if contract can be terminated
    if (contract.status === 'Completed' || contract.status === 'Terminated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot terminate a completed or already terminated contract'
      });
    }

    // Update contract
    contract.status = 'Terminated';
    contract.terminationReason = terminationReason;
    contract.terminationDate = new Date();

    await contract.save();

    // Update project status
    project.status = 'Cancelled';
    await project.save();

    // Notify freelancer
    // In a real app, you would send a notification
    console.log(`Contract terminated for project: ${project.title}`);

    res.status(200).json({
      success: true,
      message: 'Contract terminated successfully',
      data: {
        contract
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContract,
  getContractByProject,
  updateContract,
  signContract,
  terminateContract
};
