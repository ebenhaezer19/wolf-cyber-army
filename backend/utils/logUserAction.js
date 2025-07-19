const { Log } = require('../models');

async function logUserAction(userId, action, ipAddress = null) {
  try {
    await Log.create({ 
      user_id: userId, 
      action,
      ip_address: ipAddress 
    });
  } catch (err) {
    // Optionally log to console or external service
    console.error('Failed to log user action:', err.message);
  }
}

module.exports = logUserAction;
