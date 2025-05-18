const Client = require('../../models/Client');
const User = require('../../models/User');

/**
 * Get client profile
 * @route GET /api/client/profile
 * @access Private (Client only)
 */
const getClientProfile = async (req, res, next) => {
  try {
    // Get client
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        client
      }
    });
  } catch (error) {
    console.error('Error getting client profile:', error);
    next(error);
  }
};

/**
 * Update client profile
 * @route PUT /api/client/profile
 * @access Private (Client only)
 */
const updateClientProfile = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      position,
      website,
      location,
      bio,
      profileImage
    } = req.body;

    // Get client
    let client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Update user info
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;
    
    await user.save();

    // Update client info
    if (company) client.company = company;
    if (position) client.position = position;
    if (website) client.website = website;
    if (location) client.location = location;
    if (bio) client.bio = bio;

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
        client
      }
    });
  } catch (error) {
    console.error('Error updating client profile:', error);
    next(error);
  }
};

module.exports = {
  getClientProfile,
  updateClientProfile
};
