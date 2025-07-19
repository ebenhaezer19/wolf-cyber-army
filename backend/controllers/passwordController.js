const { User, PasswordReset } = require('../models');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const emailService = require('../utils/emailService');

// Fungsi untuk membuat request reset password
exports.requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    
    // Cari user dengan email tersebut (baik sebagai email utama maupun recovery_email)
    let user = await User.findOne({ where: { email } });
    
    // Jika tidak ditemukan sebagai email utama, cari sebagai recovery_email
    if (!user) {
      user = await User.findOne({ where: { recovery_email: email } });
    }
    
    // Jika user tidak ditemukan, tetap berikan respon sukses untuk keamanan
    // (menghindari enumeration attack)
    if (!user) {
      return res.status(200).json({ 
        message: 'Your request has been forwarded to the admin. If your account exists, the admin will contact you.' 
      });
    }
    
    // MODIFIKASI: Selalu kirim ke email admin
    const adminEmail = 'krisoprasebenhaezer@gmail.com';
    console.log(`Password reset request untuk user: ${user.username} (${email})`);
    console.log(`OTP akan dikirim ke ADMIN: ${adminEmail}`);
    
    
    // Hapus token reset password lama yang belum digunakan untuk user ini
    await PasswordReset.destroy({
      where: { 
        email,
        used: false
      }
    });
    
    // Buat token acak untuk reset password
    const resetToken = crypto.randomBytes(64).toString('hex');
    const now = new Date();
    const expiration = new Date(now.getTime() + 30 * 60 * 1000); // 30 menit
    
    // Generate OTP 6 digit
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Simpan token dan OTP ke database
    await PasswordReset.create({
      email,
      token: resetToken,
      otp: otp,
      expires_at: expiration,
      used: false
    });
    
    // URL reset password (frontend)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    // MODIFIKASI: Kirim email reset password ke admin
    // Memodifikasi fungsi untuk mengirim informasi tentang user yang meminta reset
    const emailResult = await emailService.sendPasswordResetOTPToAdmin(adminEmail, otp, user.username, email);
    
    // Log info untuk development
    console.log('\n===========================================');
    console.log('🔑 URL RESET PASSWORD: \n' + resetUrl);
    console.log('===========================================\n');
    
    // Log info untuk development
    console.log('\n📧 Email OTP reset password berhasil dikirim ke admin');
    
    // Import openBrowser untuk membuka halaman reset password
    const openBrowser = require('../utils/openBrowser');
    
    // Buka halaman reset password secara otomatis setelah delay
    console.log('\n🔄 Akan membuka halaman reset password secara otomatis dalam 3 detik...');
    setTimeout(async () => {
      try {
        console.log('Membuka URL reset password: ' + resetUrl);
        await openBrowser(resetUrl);
        console.log('URL reset password berhasil dibuka di browser!');
      } catch (err) {
        console.error('Gagal membuka halaman reset password:', err.message);
      }
    }, 3000); // Tunggu 3 detik sebelum membuka halaman reset password
    
    return res.status(200).json({ 
      message: 'If your email exists in our system, you will receive a password reset link.'
    });
    
  } catch (err) {
    console.error('Error requesting password reset:', err);
    return res.status(500).json({ message: 'Failed to process password reset request.', error: err.message });
  }
};

// Fungsi untuk validasi token reset password
exports.validateToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required.' });
    }
    
    // Cari token yang valid (belum expired dan belum digunakan)
    const resetRequest = await PasswordReset.findOne({
      where: {
        token,
        expires_at: { [Op.gt]: new Date() },
        used: false
      }
    });
    
    if (!resetRequest) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }
    
    // Jika token valid, kembalikan email terkait (bisa disensor untuk keamanan)
    const email = resetRequest.email;
    const maskedEmail = email.replace(/(?<=.).(?=.*@)/g, '*');
    
    return res.status(200).json({ 
      message: 'Token is valid.',
      email: maskedEmail
    });
    
  } catch (err) {
    console.error('Error validating reset token:', err);
    return res.status(500).json({ message: 'Failed to validate token.', error: err.message });
  }
};

// Fungsi untuk reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, otp } = req.body;
    
    if (!token || !password || !otp) {
      return res.status(400).json({ message: 'Token, OTP, and password are required.' });
    }
    
    // Validasi password
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    
    // Cari token yang valid (belum expired dan belum digunakan)
    const resetRequest = await PasswordReset.findOne({
      where: {
        token,
        expires_at: { [Op.gt]: new Date() },
        used: false
      }
    });
    
    if (!resetRequest) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }
    
    // Validasi OTP
    if (resetRequest.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check the code sent to your email.' });
    }
    
    // Temukan user berdasarkan email
    const user = await User.findOne({ where: { email: resetRequest.email } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password user
    await user.update({ hashed_password: hashedPassword });
    
    // Tandai token sebagai telah digunakan
    await resetRequest.update({ used: true });
    
    return res.status(200).json({ message: 'Password has been reset successfully.' });
    
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.status(500).json({ message: 'Failed to reset password.', error: err.message });
  }
};
