/**
 * Middleware untuk mengekstrak alamat IP pengguna dan menyimpannya di objek request
 * untuk digunakan oleh fungsi lain.
 */
const extractIpAddress = (req, res, next) => {
  // Ekstraksi IP address
  const ipAddress = req.headers['x-forwarded-for'] || 
                    req.socket.remoteAddress ||
                    null;
                    
  // Jika IP adalah ::1 (localhost IPv6), konversi ke 127.0.0.1
  req.clientIp = ipAddress === '::1' ? '127.0.0.1' : ipAddress;
  
  next();
};

module.exports = extractIpAddress;
