const { Log, User } = require('../models');

// Get all logs (admin/mod only)
exports.getAllLogs = async (req, res) => {
  try {
    const { user_id, action } = req.query;
    const where = {};
    if (user_id) where.user_id = user_id;
    if (action) where.action = { $like: `%${action}%` };
    const logs = await Log.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'username', 'role'] }],
      order: [['timestamp', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs.', error: err.message });
  }
};

// Get recent activities for a specific user
exports.getUserRecentActivity = async (req, res) => {
  try {
    // Jika user_id tidak ada di params, gunakan ID user yang sedang login
    const userId = req.params.userId || req.user.id;
    
    // Pastikan pengguna hanya dapat melihat aktivitas mereka sendiri
    // kecuali jika mereka admin (yang dapat melihat aktivitas semua pengguna)
    if (req.user.id != userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You are not authorized to view this user\'s activity.' 
      });
    }
    
    // Ambil 10 aktivitas terbaru untuk pengguna tersebut
    const recentActivity = await Log.findAll({
      where: { user_id: userId },
      order: [['timestamp', 'DESC']],
      limit: 10, // Hanya ambil 10 aktivitas terbaru
      include: [
        { 
          model: User, 
          attributes: ['id', 'username', 'profile_picture'] 
        }
      ]
    });
    
    // Format tanggal untuk tampilan yang lebih baik
    const formattedActivity = recentActivity.map(activity => ({
      id: activity.id,
      action: activity.action,
      timestamp: activity.timestamp,
      formattedTime: new Date(activity.timestamp).toLocaleString(),
      ip_address: activity.ip_address,
      user: activity.User ? {
        id: activity.User.id,
        username: activity.User.username,
        profile_picture: activity.User.profile_picture
      } : null
    }));
    
    res.json(formattedActivity);
  } catch (err) {
    console.error('Error fetching user activity:', err);
    res.status(500).json({ 
      message: 'Failed to fetch recent activity.', 
      error: err.message 
    });
  }
};
