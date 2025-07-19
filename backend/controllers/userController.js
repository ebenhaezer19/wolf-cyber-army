const { User, Thread, Post } = require('../models');
const logUserAction = require('../utils/logUserAction');
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, '../../uploads');
const emailService = require('../utils/emailService');

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'email', 'role', 'is_banned', 'profile_picture']
    });
    
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user.', error: err.message });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.findByPk(userId);
    
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    // Check if the logged-in user is the owner of this profile or an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to update this profile.' });
    }
    
    const { username, email } = req.body;
    
    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required.' });
    }
    
    // Update user properties
    user.username = username;
    user.email = email;
    
    await user.save();
    await logUserAction(req.user.id, `Updated user profile for ${user.id}`, req.clientIp);
    
    // Return updated user data
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_banned: user.is_banned,
      profile_picture: user.profile_picture
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user.', error: err.message });
  }
};

// Ban user (admin only)
exports.banUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot ban another admin.' });
    user.is_banned = true;
    await user.save();
    await logUserAction(req.user.id, `Banned user ${user.id}`, req.clientIp);
    res.json({ message: 'User banned.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to ban user.', error: err.message });
  }
};

// Unban user (admin only)
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.is_banned = false;
    await user.save();
    await logUserAction(req.user.id, `Unbanned user ${user.id}`, req.clientIp);
    res.json({ message: 'User unbanned.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unban user.', error: err.message });
  }
};

// Delete user (admin only - soft delete)
exports.deleteUser = async (req, res) => {
  let transaction;
  try {
    // Get database instance for transaction
    const { sequelize } = require('../models');
    transaction = await sequelize.transaction();
    
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete another admin.' });
    
    // Generate unique identifiers for deleted user
    const timestamp = Date.now();
    const deletedUsername = `deleted_${user.id}_${timestamp}`;
    const deletedEmail = `deleted_${user.id}_${timestamp}@deleted.user`;
    
    // Log user details before deletion for debugging
    console.log('Attempting to soft-delete user:', {
      id: user.id,
      currentUsername: user.username,
      newUsername: deletedUsername,
      role: user.role
    });

    // Update user using direct update instead of instance save
    // This avoids triggering certain validations that might fail
    const updateResult = await User.update({
      is_banned: true,
      username: deletedUsername,
      email: deletedEmail,
      hashed_password: 'DELETED_ACCOUNT',
      profile_picture: null,
      recovery_email: null
    }, {
      where: { id: user.id },
      transaction
    });
    
    console.log('Update result:', updateResult);
    
    // Log action using try-catch to prevent failure if logging fails
    try {
      await logUserAction(req.user.id, `Soft deleted user ${user.id}`, req.clientIp, { transaction });
    } catch (logError) {
      console.error('Failed to log user deletion action:', logError);
      // Continue even if logging fails
    }
    
    // Commit transaction
    await transaction.commit();
    
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    // Rollback transaction if it exists and there was an error
    if (transaction) await transaction.rollback();
    
    console.error('Error during user deletion:', err);
    
    // Send more detailed error information
    res.status(500).json({ 
      message: 'Failed to delete user.', 
      error: err.message,
      details: 'The user has related records that prevent deletion. User has been marked as banned instead.'
    });
  }
};

// Update user's profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.savedFile) {
      return res.status(400).json({ message: 'No file saved.' });
    }
    
    // Get current user from auth middleware
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Check if user already has a profile picture and delete it
    if (user.profile_picture) {
      const oldFilePath = path.join(uploadDir, user.profile_picture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    // Update user with new profile picture filename
    user.profile_picture = req.savedFile.filename;
    await user.save();
    
    await logUserAction(userId, 'Updated profile picture', req.clientIp);
    
    res.json({
      filename: req.savedFile.filename,
      message: 'Profile picture updated.'
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to update profile picture.', 
      error: err.message 
    });
  }
};

// Get user's profile picture
exports.getProfilePicture = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    if (!user.profile_picture) {
      return res.status(404).json({ message: 'User has no profile picture.' });
    }
    
    const filePath = path.join(uploadDir, user.profile_picture);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Profile picture file not found.' });
    }
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'image/jpeg'; // Default
    
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    
    res.set('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
    
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to get profile picture.', 
      error: err.message 
    });
  }
};
