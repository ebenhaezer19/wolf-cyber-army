const { User } = require('../models');
const logUserAction = require('../utils/logUserAction');
const emailService = require('../utils/emailService');

// Set user's recovery email (for users who registered with fake email)
exports.setRecoveryEmail = async (req, res) => {
  try {
    const { recoveryEmail } = req.body;
    
    if (!recoveryEmail) {
      return res.status(400).json({ message: 'Recovery email is required.' });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    
    // Get current user from auth middleware
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Check if recovery email is same as primary email
    if (recoveryEmail === user.email) {
      return res.status(400).json({ 
        message: 'Recovery email cannot be the same as your primary email.'
      });
    }
    
    // Generate verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP temporarily (ideally in Redis, but for now we'll use a simple session approach)
    if (!req.session) {
      req.session = {};
    }
    req.session.recoveryEmailOTP = {
      email: recoveryEmail,
      otp: otp,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    };
    
    // Send verification email
    await emailService.sendPasswordResetOTP(recoveryEmail, otp);
    
    res.status(200).json({ 
      message: 'Verification code sent to the recovery email. Please verify to complete setup.' 
    });
    
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to set recovery email.', 
      error: err.message 
    });
  }
};

// Verify recovery email with OTP
exports.verifyRecoveryEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required.' });
    }
    
    // Get current user
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Check if we have a pending recovery email verification
    if (!req.session || !req.session.recoveryEmailOTP) {
      return res.status(400).json({ 
        message: 'No pending recovery email verification. Please request a new code.'
      });
    }
    
    const { email, otp: storedOTP, expires } = req.session.recoveryEmailOTP;
    
    // Check if OTP is expired
    if (Date.now() > expires) {
      delete req.session.recoveryEmailOTP;
      return res.status(400).json({ message: 'Verification code expired. Please request a new code.' });
    }
    
    // Check if OTP matches
    if (otp !== storedOTP) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }
    
    // Update user with verified recovery email
    user.recovery_email = email;
    await user.save();
    
    // Clear session data
    delete req.session.recoveryEmailOTP;
    
    await logUserAction(userId, 'Added recovery email');
    
    res.json({ 
      message: 'Recovery email verified and set successfully.',
      recovery_email: email
    });
    
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to verify recovery email.', 
      error: err.message 
    });
  }
};

// Get recovery email for a user
exports.getRecoveryEmail = async (req, res) => {
  try {
    // Get current user
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.json({ 
      recovery_email: user.recovery_email || null,
      primary_email: user.email
    });
    
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to get recovery email.', 
      error: err.message 
    });
  }
};
