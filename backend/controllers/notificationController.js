const db = require('../models');
const Notification = db.Notification;

// List notifications for logged-in user (with optional unread filter & pagination)
exports.getNotifications = async (req, res) => {
  try {
    const { unread, limit = 20, offset = 0 } = req.query;
    const where = { user_id: req.user.id };
    if (unread === 'true') where.is_read = false;
    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

// Mark notifications as read (accepts array of notification ids)
exports.markAsRead = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No notification ids provided.' });
    }
    await Notification.update(
      { is_read: true },
      { where: { id: ids, user_id: req.user.id } }
    );
    res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notifications as read', error: err.message });
  }
};
