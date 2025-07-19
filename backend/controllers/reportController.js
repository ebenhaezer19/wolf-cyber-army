const { Report, User, Thread, Post, Log } = require('../models');
const logUserAction = require('../utils/logUserAction');

// Submit a new report
exports.submitReport = async (req, res) => {
  try {
    const { target_id, target_type, reason, details } = req.body;
    const reporter_id = req.user.id;
    
    // Validasi tipe target
    if (!['thread', 'post'].includes(target_type)) {
      return res.status(400).json({ message: 'Invalid target type. Must be "thread" or "post".' });
    }
    
    // Validasi bahwa target ada
    const Model = target_type === 'thread' ? Thread : Post;
    const target = await Model.findByPk(target_id);
    
    if (!target) {
      return res.status(404).json({ message: `${target_type} not found.` });
    }
    
    // Periksa apakah user sudah pernah melaporkan target yang sama dan belum diproses
    const existingReport = await Report.findOne({
      where: {
        reporter_id,
        target_id,
        target_type,
        status: 'pending'
      }
    });
    
    if (existingReport) {
      return res.status(400).json({ 
        message: `You have already reported this ${target_type}. Your report is pending review.` 
      });
    }
    
    // Buat laporan baru
    const report = await Report.create({
      reporter_id,
      target_id,
      target_type,
      reason,
      details: details || null,
      status: 'pending'
    });
    
    // Log aktivitas
    await logUserAction(
      reporter_id, 
      `Reported a ${target_type}`, 
      req.clientIp
    );
    
    return res.status(201).json({
      message: `Thank you for your report. Our moderators will review it soon.`,
      data: {
        id: report.id,
        status: report.status,
        created_at: report.created_at
      }
    });
    
  } catch (err) {
    console.error('Error submitting report:', err);
    return res.status(500).json({ 
      message: 'Failed to submit report.', 
      error: err.message 
    });
  }
};

// Get all reports (admin only)
exports.getAllReports = async (req, res) => {
  try {
    // Query parameters for filtering
    const { status, target_type } = req.query;
    const whereClause = {};
    
    // Filter by status if provided
    if (status && ['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
      whereClause.status = status;
    }
    
    // Filter by target_type if provided
    if (target_type && ['thread', 'post'].includes(target_type)) {
      whereClause.target_type = target_type;
    }
    
    // Get all reports with reporter details
    const reports = await Report.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username']
        }
      ],
      order: [
        ['status', 'ASC'], // Prioritize 'pending' first
        ['created_at', 'DESC'] // Newest first
      ]
    });
    
    // Enrich with target content information
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      const reportData = report.toJSON();
      
      // Get target details based on type
      try {
        if (reportData.target_type === 'thread') {
          const thread = await Thread.findByPk(reportData.target_id, {
            attributes: ['id', 'title', 'content', 'user_id'],
            include: [
              {
                model: User,
                attributes: ['id', 'username']
              }
            ]
          });
          
          if (thread) {
            reportData.target = {
              id: thread.id,
              title: thread.title,
              content: thread.content && thread.content.length > 100 
                ? thread.content.substring(0, 100) + '...' 
                : thread.content,
              user: thread.User ? {
                id: thread.User.id,
                username: thread.User.username
              } : null
            };
          }
        } else if (reportData.target_type === 'post') {
          const post = await Post.findByPk(reportData.target_id, {
            attributes: ['id', 'content', 'user_id', 'thread_id'],
            include: [
              {
                model: User,
                attributes: ['id', 'username']
              },
              {
                model: Thread,
                attributes: ['id', 'title']
              }
            ]
          });
          
          if (post) {
            reportData.target = {
              id: post.id,
              content: post.content && post.content.length > 100 
                ? post.content.substring(0, 100) + '...' 
                : post.content,
              user: post.User ? {
                id: post.User.id,
                username: post.User.username
              } : null,
              thread: post.Thread ? {
                id: post.Thread.id,
                title: post.Thread.title
              } : null
            };
          }
        }
      } catch (err) {
        console.error(`Error fetching target details for report ${reportData.id}:`, err);
        reportData.target = { error: 'Could not fetch target details' };
      }
      
      return reportData;
    }));
    
    return res.status(200).json({
      message: 'Reports retrieved successfully',
      data: enrichedReports
    });
    
  } catch (err) {
    console.error('Error retrieving reports:', err);
    return res.status(500).json({ 
      message: 'Failed to retrieve reports.', 
      error: err.message 
    });
  }
};

// Update report status (admin only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const admin_id = req.user.id;
    
    // Validasi status
    if (!['reviewed', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be "reviewed", "resolved", or "rejected".' 
      });
    }
    
    // Cari report yang akan diupdate
    const report = await Report.findByPk(id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }
    
    // Update status dan catatan admin
    await report.update({
      status,
      admin_notes: admin_notes || report.admin_notes,
      updated_at: new Date()
    });
    
    // Log aktivitas admin
    await logUserAction(
      admin_id, 
      `Updated report #${id} status to ${status}`, 
      req.clientIp
    );
    
    return res.status(200).json({
      message: `Report status updated to ${status} successfully.`,
      data: {
        id: report.id,
        status: report.status,
        updated_at: report.updated_at
      }
    });
    
  } catch (err) {
    console.error('Error updating report status:', err);
    return res.status(500).json({ 
      message: 'Failed to update report status.', 
      error: err.message 
    });
  }
};

// Send warning to reported user
exports.sendWarning = async (req, res) => {
  try {
    const { id } = req.params;
    const { warning_message } = req.body;
    const admin_id = req.user.id;
    
    if (!warning_message) {
      return res.status(400).json({ message: 'Warning message is required.' });
    }
    
    // Cari report
    const report = await Report.findByPk(id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }
    
    // Cari target (thread/post) untuk mendapatkan user ID
    const Model = report.target_type === 'thread' ? Thread : Post;
    const target = await Model.findByPk(report.target_id);
    
    if (!target) {
      return res.status(404).json({ message: `Reported ${report.target_type} not found.` });
    }
    
    // Kirim peringatan (simpan sebagai notifikasi)
    const { Notification } = require('../models');
    await Notification.create({
      user_id: target.user_id,
      type: 'warning',
      message: warning_message,
      link: report.target_type === 'thread' 
        ? `/threads/${target.id}` 
        : `/threads/${target.thread_id}#post-${target.id}`
    });
    
    // Update report status menjadi reviewed jika masih pending
    if (report.status === 'pending') {
      await report.update({
        status: 'reviewed',
        admin_notes: (report.admin_notes ? report.admin_notes + '\n' : '') + 
          `Warning sent: ${warning_message}`,
        updated_at: new Date()
      });
    }
    
    // Log aktivitas admin
    await logUserAction(
      admin_id, 
      `Sent warning to user for report #${id}`, 
      req.clientIp
    );
    
    return res.status(200).json({
      message: 'Warning sent successfully.',
      data: {
        report_id: report.id,
        report_status: report.status
      }
    });
    
  } catch (err) {
    console.error('Error sending warning:', err);
    return res.status(500).json({ 
      message: 'Failed to send warning.', 
      error: err.message 
    });
  }
};
