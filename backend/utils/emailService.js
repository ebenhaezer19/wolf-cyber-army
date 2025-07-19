const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');
const openBrowser = require('./openBrowser');

// Tentukan environment (development, production, atau test)
const env = process.env.NODE_ENV || 'development';
const config = emailConfig[env];

// Konfigurasi transporter email
let transporter;

// Inisialisasi transporter
const initTransporter = async () => {
  try {
    // Cek apakah kita menggunakan Gmail SMTP
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('Menggunakan Gmail SMTP untuk email asli');
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } 
    // Cek konfigurasi SMTP custom (jika ada)
    else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('Menggunakan konfigurasi SMTP custom');
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    
    // Jika tidak ada konfigurasi email asli, gunakan Ethereal untuk testing
    console.log('Tidak ada konfigurasi email asli, menggunakan Ethereal untuk testing');
    console.log('PERINGATAN: Email tidak akan dikirim ke alamat asli!');
    
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      console.log('Ethereal Email credentials:');
      console.log(`Username: ${testAccount.user}`);
      console.log(`Password: ${testAccount.pass}`);
      console.log(`Preview URL: https://ethereal.email`);
      
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true untuk 465, false untuk port lainnya
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (etherealError) {
      console.error('Error creating Ethereal test account:', etherealError);
      console.log('Fallback ke simple SMTP transporter (tidak akan benar-benar mengirim email)');
      
      // Fallback ke transporter dummy jika ethereal gagal
      return {
        sendMail: async (options) => {
          console.log('=== EMAIL KONTEN (DUMMY MODE) ===');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`Text content: ${options.text.substring(0, 100)}...`);
          return { messageId: 'dummy-id-' + Date.now() };
        }
      };
    }
  } catch (error) {
    console.error('Transporter initialization error:', error);
    throw error;
  }
};

// Kirim email reset password dengan OTP
const sendPasswordResetOTP = async (to, otp) => {
  try {
    // Pastikan transporter sudah diinisialisasi
    if (!transporter) {
      try {
        console.log('Menginisialisasi transporter email...');
        transporter = await initTransporter();
        console.log('Transporter email berhasil diinisialisasi');
      } catch (initError) {
        console.error('Gagal menginisialisasi transporter:', initError);
        return { 
          success: false, 
          error: 'Gagal menginisialisasi transporter email', 
          details: initError.message 
        };
      }
    }

    const currentTime = new Date().toLocaleTimeString();
    const isRealEmail = process.env.EMAIL_USER || process.env.SMTP_HOST;
    
    // Default sender
    const fromEmail = process.env.EMAIL_USER || 
                      (emailConfig && emailConfig[env] && emailConfig[env].defaultFrom) || 
                      '"Wolf Cyber Army" <security@wolfcyberarmy.com>';
    
    // Log untuk debugging
    console.log(`[${currentTime}] Mengirim email OTP ke: ${to}`);
    console.log(`OTP yang dikirim: ${otp}`);
    if (!isRealEmail) {
      console.log('⚠️ MENGGUNAKAN EMAIL ETHEREAL (TIDAK DIKIRIM KE EMAIL ASLI) ⚠️');
    }
    
    // Template email
    const emailOptions = {
      from: fromEmail,
      to: to,
      subject: "Password Reset OTP - Wolf Cyber Army",
      text: `Kode OTP untuk reset password Anda: ${otp}.
Kode ini berlaku selama 30 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

Wolf Cyber Army
Keamanan Akun`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Wolf Cyber Army</h2>
          <h3 style="color: #555; text-align: center;">Kode OTP Reset Password</h3>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">Kode OTP ini berlaku selama <strong>30 menit</strong>.</p>
          <p style="color: #666;">Jika Anda tidak meminta reset password, silakan abaikan email ini dan password Anda akan tetap aman.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666;"><strong>Peringatan Keamanan:</strong> Jangan pernah membagikan kode OTP ini kepada siapapun, termasuk staf Wolf Cyber Army. Tim kami tidak akan pernah meminta kode OTP Anda.</p>
          <p style="color: #999; font-size: 12px; text-align: center;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
        </div>
      `
    };
    
    // Kirim email dengan error handling yang lebih baik
    let info;
    try {
      console.log('Mengirim email dengan transporter...');
      info = await transporter.sendMail(emailOptions);
      console.log('Email berhasil dikirim dengan ID:', info.messageId);
    } catch (sendError) {
      console.error('Error saat mengirim email:', sendError);
      return {
        success: false,
        error: 'Gagal mengirim email',
        details: sendError.message
      };
    }
    
    console.log(`Email terkirim dengan ID: ${info.messageId}`);
    
    // URL untuk preview jika menggunakan Ethereal
    if (!isRealEmail && info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`🔍 PREVIEW EMAIL: ${previewUrl}`);
      console.log(`⚠️ REMINDER: Email tidak terkirim ke alamat asli. Browser akan terbuka otomatis dengan preview email.`);
      
      // Buka browser otomatis dengan preview URL
      try {
        // Panggil openBrowser tanpa await karena kita tidak perlu menunggu hasilnya
        // dan tidak ingin menghambat respons API
        openBrowser(previewUrl).then(success => {
          if (success) {
            console.log(`✅ Browser dibuka otomatis dengan preview email`);
          } else {
            console.log(`⚠️ Browser mungkin tidak terbuka secara otomatis`);
            console.log(`Silakan buka URL manual: ${previewUrl}`);
          }
        });
      } catch (browserError) {
        console.error(`❌ Gagal membuka browser otomatis:`, browserError);
        console.log(`Silakan buka URL manual: ${previewUrl}`);
      }
      
      return {
        success: true,
        previewUrl,
        warning: 'Email dikirim ke Ethereal, bukan ke alamat asli!'
      };
    }
    
    return { 
      success: true,
      realEmail: !!isRealEmail 
    };
  } catch (error) {
    console.error("Error mengirim email:", error);
    return { success: false, error: error.message };
  }
};

// Fungsi khusus untuk mengirim OTP reset password ke admin
const sendPasswordResetOTPToAdmin = async (adminEmail, otp, username, userEmail) => {
  try {
    // Pastikan transporter sudah diinisialisasi
    if (!transporter) {
      try {
        console.log('Menginisialisasi transporter email...');
        transporter = await initTransporter();
        console.log('Transporter email berhasil diinisialisasi');
      } catch (initError) {
        console.error('Gagal menginisialisasi transporter:', initError);
        return { 
          success: false, 
          error: 'Gagal menginisialisasi transporter email', 
          details: initError.message 
        };
      }
    }

    const currentTime = new Date().toLocaleTimeString();
    const isRealEmail = process.env.EMAIL_USER || process.env.SMTP_HOST;
    
    // Default sender
    const fromEmail = process.env.EMAIL_USER || 
                      (emailConfig && emailConfig[env] && emailConfig[env].defaultFrom) || 
                      '"Wolf Cyber Army" <security@wolfcyberarmy.com>';
    
    // Log untuk debugging
    console.log(`[${currentTime}] Mengirim OTP reset password ke ADMIN: ${adminEmail}`);
    console.log(`OTP untuk user ${username} (${userEmail}): ${otp}`);
    if (!isRealEmail) {
      console.log('⚠️ MENGGUNAKAN EMAIL ETHEREAL (TIDAK DIKIRIM KE EMAIL ASLI) ⚠️');
    }
    
    // Template email khusus untuk admin
    const emailOptions = {
      from: fromEmail,
      to: adminEmail,
      subject: "[ADMIN] Password Reset OTP Request - Wolf Cyber Army",
      text: `Ada permintaan reset password dari user berikut:

Username: ${username}
Email: ${userEmail}
Kode OTP: ${otp}

Kode ini berlaku selama 30 menit.

Wolf Cyber Army
Keamanan Akun`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Wolf Cyber Army</h2>
          <h3 style="color: #555; text-align: center;">Password Reset Request (ADMIN ONLY)</h3>
          
          <div style="background-color: #f8f8f8; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff;">
            <p><strong>User Request Information:</strong></p>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border: 2px dashed #007bff;">
            ${otp}
          </div>
          
          <p style="color: #666;">Kode OTP ini berlaku selama <strong>30 menit</strong>.</p>
          <p style="color: #666;">Mohon berikan kode OTP ini kepada user yang bersangkutan setelah Anda melakukan verifikasi identitas.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666;"><strong>Security Notice:</strong> Harap pastikan bahwa Anda memberikan kode OTP ini hanya kepada user yang tepat setelah memverifikasi identitas mereka.</p>
          <p style="color: #999; font-size: 12px; text-align: center;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
        </div>
      `
    };
    
    // Kirim email dengan error handling yang lebih baik
    let info;
    try {
      console.log('Mengirim email ke admin dengan transporter...');
      info = await transporter.sendMail(emailOptions);
      console.log('Email admin berhasil dikirim dengan ID:', info.messageId);
    } catch (sendError) {
      console.error('Error saat mengirim email ke admin:', sendError);
      return {
        success: false,
        error: 'Gagal mengirim email ke admin',
        details: sendError.message
      };
    }
    
    console.log(`Email terkirim dengan ID: ${info.messageId}`);
    
    // Jika menggunakan Ethereal, tampilkan link preview
    let result = { success: true };
    
    if (!isRealEmail) {
      // Link preview untuk Ethereal email
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`\n📧 PREVIEW EMAIL: ${previewUrl}\n`);
      result.previewUrl = previewUrl;
      
      // Hanya log URL preview tanpa membuka browser
      console.log('Email untuk admin berisi OTP reset password:');
      console.log(`Preview tersedia di: ${previewUrl}`);
      console.log('\nADMIN: Buka URL di atas secara manual jika ingin melihat email');
      console.log('JANGAN bagikan OTP kepada siapapun kecuali Anda telah memverifikasi identitas user.');
      
      // TIDAK membuka browser secara otomatis
    }
    
    return result;
    
  } catch (err) {
    console.error('Error sending password reset OTP to admin:', err);
    return { 
      success: false, 
      error: err.message 
    };
  }
};

module.exports = {
  sendPasswordResetOTP,
  sendPasswordResetOTPToAdmin
};
