/**
 * Email configuration for Wolf Cyber Army
 * 
 * Konfigurasi untuk layanan email
 * Gunakan variabel lingkungan (environment variables) untuk kredensial
 */

module.exports = {
  // Default configuration (development)
  development: {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || '', // Masukkan email Gmail di .env
      pass: process.env.EMAIL_PASS || ''  // Masukkan password app Gmail di .env
    },
    defaultFrom: '"Wolf Cyber Army" <security@wolfcyberarmy.com>'
  },
  
  // Production configuration
  production: {
    service: 'gmail', // Bisa diganti dengan layanan lain seperti SendGrid, Mailgun, dll
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    defaultFrom: '"Wolf Cyber Army" <no-reply@wolfcyberarmy.com>'
  },
  
  // Testing configuration (menggunakan ethereal)
  test: {
    useEthereal: true
  }
};
