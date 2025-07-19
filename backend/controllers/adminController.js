const { PasswordReset, User } = require('../models');
const { Op } = require('sequelize');

// Get all password reset OTPs
exports.getPasswordResetRequests = async (req, res) => {
  try {
    // Ambil semua request reset password yang belum digunakan dan belum expired
    const resetRequests = await PasswordReset.findAll({
      where: {
        expires_at: { [Op.gt]: new Date() }, // Belum expired
        used: false // Belum digunakan
      },
      order: [['created_at', 'DESC']], // Urutkan dari yang terbaru
      attributes: ['id', 'email', 'otp', 'created_at', 'expires_at']
    });

    // Untuk setiap request, cari informasi user
    const requestsWithUserInfo = await Promise.all(
      resetRequests.map(async (request) => {
        const { id, email, otp, created_at, expires_at } = request;
        
        // Cari user berdasarkan email
        let user = await User.findOne({ 
          where: { email },
          attributes: ['id', 'username', 'email'] 
        });
        
        // Jika tidak ditemukan dengan email utama, coba dengan recovery_email
        if (!user) {
          user = await User.findOne({ 
            where: { recovery_email: email },
            attributes: ['id', 'username', 'email', 'recovery_email'] 
          });
        }
        
        return {
          id,
          email,
          otp,
          createdAt: created_at,
          expiresAt: expires_at,
          user: user ? {
            id: user.id,
            username: user.username,
            email: user.email,
            recoveryEmail: user.recovery_email
          } : null
        };
      })
    );

    console.log('Data yang dikirim ke frontend:', JSON.stringify(requestsWithUserInfo, null, 2));
    return res.status(200).json({
      message: 'Password reset requests retrieved successfully',
      data: requestsWithUserInfo
    });
  } catch (err) {
    console.error('Error retrieving password reset requests:', err);
    return res.status(500).json({ 
      message: 'Failed to retrieve password reset requests',
      error: err.message 
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Ambil semua user
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'is_banned', 'profile_picture', 'created_at'],
      order: [['id', 'ASC']]
    });

    return res.status(200).json(users);
  } catch (err) {
    console.error('Error retrieving users:', err);
    return res.status(500).json({ 
      message: 'Failed to retrieve users',
      error: err.message 
    });
  }
};

// Tandai OTP sebagai sudah digunakan (opsional)
exports.markOtpAsUsed = async (req, res) => {
  try {
    const { id } = req.params;
    
    const resetRequest = await PasswordReset.findByPk(id);
    
    if (!resetRequest) {
      return res.status(404).json({ message: 'Reset request not found' });
    }
    
    await resetRequest.update({ used: true });
    
    return res.status(200).json({ 
      message: 'Reset request marked as used successfully' 
    });
  } catch (err) {
    console.error('Error marking reset request as used:', err);
    return res.status(500).json({ 
      message: 'Failed to mark reset request as used',
      error: err.message 
    });
  }
};
