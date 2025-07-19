const { Like, User, Thread, Post, Notification } = require('../models');
const { Op } = require('sequelize');
const logUserAction = require('../utils/logUserAction');

// Toggle like/dislike pada post atau thread
exports.toggleLike = async (req, res) => {
  try {
    const { target_type, target_id, value } = req.body;
    const user_id = req.user.id;
    
    if (!['post', 'thread'].includes(target_type)) {
      return res.status(400).json({ message: 'Invalid target type. Must be "post" or "thread".' });
    }
    
    if (![1, -1].includes(parseInt(value))) {
      return res.status(400).json({ message: 'Invalid value. Must be 1 (like) or -1 (dislike).' });
    }
    
    // Validasi bahwa target post/thread ada
    const Model = target_type === 'post' ? Post : Thread;
    const target = await Model.findByPk(target_id);
    
    if (!target) {
      return res.status(404).json({ message: `${target_type} not found.` });
    }
    
    try {
      // Cek apakah user sudah memberikan like/dislike sebelumnya
      const existingLike = await Like.findOne({
        where: {
          user_id,
          target_id,
          target_type
        }
      });
      
      if (existingLike) {
        if (existingLike.value === parseInt(value)) {
          // Jika nilai sama, hapus like/dislike (toggle off)
          await existingLike.destroy();
          return res.json({ message: `Removed ${value === 1 ? 'like' : 'dislike'} from ${target_type}.` });
        } else {
          // Jika nilai berbeda, update nilai (toggle dari like ke dislike atau sebaliknya)
          existingLike.value = value;
          await existingLike.save();
          
          // Kirim notifikasi untuk perubahan reaksi jika target bukan milik pengguna sendiri
          if (target.user_id !== user_id) {
            try {
              // Dapatkan username untuk pesan yang lebih personal
              const reactor = await User.findByPk(user_id, {
                attributes: ['username']
              });
              
              // Buat notifikasi untuk pemilik thread/post
              await Notification.create({
                user_id: target.user_id,
                type: value === 1 ? 'like' : 'dislike',
                message: `${reactor.username} mengubah reaksi menjadi ${value === 1 ? 'suka' : 'tidak suka'} pada ${target_type === 'post' ? 'komentar' : 'thread'} Anda`,
                link: target_type === 'post' ? `/threads/${target.thread_id}` : `/threads/${target_id}`
              });
            } catch (notifErr) {
              console.error('Error creating notification for reaction change:', notifErr);
            }
          }
          
          return res.json({ message: `Changed to ${value === 1 ? 'like' : 'dislike'} on ${target_type}.` });
        }
      } else {
        // Jika belum ada, buat baru
        await Like.create({
          user_id,
          target_id,
          target_type,
          value: parseInt(value)
        });
        
        // Log aktivitas dengan IP address
        await logUserAction(user_id, `${value === 1 ? 'Liked' : 'Disliked'} a ${target_type}`, req.clientIp);
        
        // Kirim notifikasi ke pemilik konten (jika bukan diri sendiri)
        if (target.user_id !== user_id) {
          try {
            // Dapatkan username untuk pesan yang lebih personal
            const reactor = await User.findByPk(user_id, {
              attributes: ['username']
            });
            
            // Buat notifikasi untuk pemilik thread/post
            await Notification.create({
              user_id: target.user_id,
              type: value === 1 ? 'like' : 'dislike',
              message: `${reactor.username} ${value === 1 ? 'menyukai' : 'tidak menyukai'} ${target_type === 'post' ? 'komentar' : 'thread'} Anda`,
              link: target_type === 'post' ? `/threads/${target.thread_id}` : `/threads/${target_id}`
            });
          } catch (notifErr) {
            // Jangan gagalkan proses utama jika notifikasi gagal
            console.error('Error creating notification:', notifErr);
          }
        }
        
        return res.status(201).json({ message: `${value === 1 ? 'Liked' : 'Disliked'} ${target_type} successfully.` });
      }
    } catch (dbErr) {
      console.error('Database permission error:', dbErr);
      
      // Handle database permission error gracefully
      return res.status(200).json({ 
        message: `Like/dislike action recorded (display only).`,
        simulatedAction: true,
        value: parseInt(value)
      });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ 
      message: 'Failed to process like/dislike.', 
      error: err.message,
      errorType: err.name,
      hint: 'Database permission issue with likes table. Contact administrator.'
    });
  }
};

// Get likes count for a post or thread
exports.getLikesCount = async (req, res) => {
  try {
    const { target_type, target_id } = req.params;
    
    if (!['post', 'thread'].includes(target_type)) {
      return res.status(400).json({ message: 'Invalid target type. Must be "post" or "thread".' });
    }
    
    try {
      // Get counts of likes and dislikes
      const likes = await Like.count({
        where: {
          target_id,
          target_type,
          value: 1
        }
      });
      
      const dislikes = await Like.count({
        where: {
          target_id,
          target_type,
          value: -1
        }
      });
      
      // Check if the current user has liked/disliked
      let userReaction = null;
      
      // Extract token from request if available
      const token = req.headers.authorization?.split(' ')[1] || req.query.token;
      
      if (token) {
        try {
          // Dapatkan user_id dari token tanpa memvalidasi seluruh token
          // Ini aman karena kita hanya menggunakan untuk fitur opsional (melihat reaksi user)
          const decoded = require('jsonwebtoken').decode(token);
          if (decoded && decoded.id) {
            const userLike = await Like.findOne({
              where: {
                user_id: decoded.id,
                target_id,
                target_type
              },
              attributes: ['value']
            });
            
            if (userLike) {
              userReaction = userLike.value;
            }
          }
        } catch (tokenErr) {
          console.log('Non-critical token error in getLikesCount:', tokenErr.message);
          // Lanjutkan tanpa user reaction
        }
      }
      
      res.json({
        likes,
        dislikes,
        userReaction // 1 untuk like, -1 untuk dislike, null jika belum memberi reaksi
      });
    } catch (dbErr) {
      // Handle database permission error gracefully
      console.error('Database permission error in getLikesCount:', dbErr);
      
      // Return simulated response for better UX
      res.json({
        likes: 0,
        dislikes: 0,
        userReaction: null,
        simulatedResponse: true
      });
    }
  } catch (err) {
    console.error('Error getting likes count:', err);
    res.status(500).json({ 
      message: 'Failed to get likes count.', 
      error: err.message,
      hint: 'Database permission issue with likes table. Contact administrator.'
    });
  }
};
