require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const extractIpAddress = require('./middleware/ipExtractor');
const { sequelize } = require('./models');
const { swaggerUi, specs } = require('./swagger');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/user');
const postRoutes = require('./routes/post');
const postAttachmentRoutes = require('./routes/postAttachment');
const app = express();
const PORT = process.env.PORT || 5002;  // Changed default port to 5002

app.use(cors());
app.use(express.json());

// Middleware untuk ekstraksi alamat IP
app.use(extractIpAddress);

// Session management untuk menyimpan OTP sementara
app.use(session({
  secret: process.env.SESSION_SECRET || 'wolf-cyber-army-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30 // 30 menit
  }
}));

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Auth routes
app.use('/api/auth', require('./routes/auth'));
// Password reset routes
app.use('/api/password', require('./routes/password'));
// Recovery email routes
app.use('/api/recovery-email', require('./routes/recoveryEmail'));

// Thread routes
app.use('/api/threads', require('./routes/thread'));
// Category routes
app.use('/api/categories', require('./routes/category'));
// Post routes
app.use('/api/posts', postRoutes);
app.use('/api/posts', postAttachmentRoutes);
// User routes (ban/unban)
app.use('/api/users', userRoutes);
app.use('/api/users', require('./routes/userProfilePicture'));
// Log routes (moderation)
app.use('/api/logs', require('./routes/log'));
// Notification routes
app.use('/api/notifications', require('./routes/notification'));
// Like routes
app.use('/api/likes', require('./routes/like'));

// Report routes (moderation)
app.use('/api/reports', require('./routes/report'));

// Upload routes
app.use('/api/upload', require('./routes/upload'));

// Admin routes
app.use('/api/admin', require('./routes/admin'));

// Debug routes (khusus untuk pengembangan)
app.use('/api/debug', require('./routes/debug'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.get('/', (req, res) => {
  res.send('Wolf Cyber Army API is running.');
});

sequelize.authenticate()
  .then(() => {
    console.log('Database connected!');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
