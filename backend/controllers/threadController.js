const { Thread, User, Post } = require('../models');
const logUserAction = require('../utils/logUserAction');

// Create Thread
exports.createThread = async (req, res) => {
  try {
    console.log('=== DEBUG: CREATE THREAD ===');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { title, content, category } = req.body;
    
    // Validasi field yang diperlukan
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    // Log informasi user dari token untuk debugging
    console.log('Auth user object:', req.user);
    
    // Validasi user_id dari token
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication failed: req.user is undefined.' });
    }
    
    if (!req.user.id) {
      return res.status(401).json({ message: 'Authentication failed: req.user.id is missing.' });
    }
    
    // Periksa nilai user ID dan konversi tipe jika perlu
    const rawUserId = req.user.id;
    console.log('Raw user ID from token:', rawUserId, 'Type:', typeof rawUserId);
    
    let userId;
    try {
      userId = parseInt(rawUserId, 10);
      if (isNaN(userId)) {
        throw new Error('User ID is not a valid number');
      }
    } catch (error) {
      console.error('Failed to parse user ID:', error);
      return res.status(400).json({ message: 'Invalid user ID format in token.' });
    }
    
    console.log('Parsed user ID:', userId, 'Type:', typeof userId);
    
    // Query database langsung untuk debugging
    try {
      const [results] = await Thread.sequelize.query('SELECT * FROM users WHERE id = ?', {
        replacements: [userId]
      });
      
      console.log('Direct DB query results for user:', results);
      
      if (results.length === 0) {
        return res.status(404).json({ message: `User with ID ${userId} not found in database.` });
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({ message: 'Database query failed', error: dbError.message });
    }
    
    // Verifikasi user ada di database menggunakan model
    try {
      const userExists = await User.findByPk(userId);
      
      if (!userExists) {
        console.error('User not found in database with ID:', userId);
        return res.status(404).json({ message: 'User not found in database via model.' });
      }
      
      console.log('User found via model:', userExists.username, 'ID:', userExists.id);
    } catch (modelError) {
      console.error('Error finding user via model:', modelError);
      return res.status(500).json({ message: 'Error querying user model', error: modelError.message });
    }
    
    // Lihat struktur tabel untuk debugging
    try {
      const [threadTableInfo] = await Thread.sequelize.query(
        "SELECT column_name, data_type, character_maximum_length FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'threads'"
      );
      console.log('Thread table schema:', threadTableInfo);
      
      // Periksa foreign key constraint
      const [fkInfo] = await Thread.sequelize.query(
        `SELECT
          tc.constraint_name, tc.table_name, kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'threads';`
      );
      console.log('Foreign key info:', fkInfo);
    } catch (schemaError) {
      console.error('Schema query error:', schemaError);
      // Tidak mengembalikan respons error untuk tetap melanjutkan proses
    }
    
    console.log('Attempting to create thread with user_id:', userId);
    
    // Prioritaskan menggunakan req.dbUser yang sudah diverifikasi oleh middleware
    // karena dbUser adalah objek User yang diambil langsung dari database
    let thread;
    
    if (req.dbUser && req.dbUser.id) {
      console.log('Using verified database user ID:', req.dbUser.id);
      
      // Buat thread dengan user_id dari objek database user yang tervalidasi
      thread = await Thread.create({
        title,
        content,
        category,
        user_id: req.dbUser.id
      });
    } else {
      // Fallback ke userId dari token jika req.dbUser tidak ada (seharusnya tidak terjadi)
      console.log('Fallback: using parsed ID from token:', userId);
      
      thread = await Thread.create({
        title,
        content,
        category,
        user_id: userId
      });
    }
    
    console.log('Thread created successfully:', thread.id);
    
    // Log aktivitas user
    const userIdForLog = req.dbUser ? req.dbUser.id : userId;
    await logUserAction(userIdForLog, `Created thread: ${title}`, req.clientIp);
    
    // Kirim respons sukses
    res.status(201).json(thread);
  } catch (err) {
    console.error('Error creating thread:', err);
    res.status(500).json({ 
      message: 'Failed to create thread.', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get All Threads
exports.getAllThreads = async (req, res) => {
  try {
    // Fetch threads with user data
    const threads = await Thread.findAll({
      include: [{ model: User, attributes: ['id', 'username', 'role'] }],
      order: [['created_at', 'DESC']]
    });
    
    // For each thread, count the number of posts (replies)
    const threadsWithCounts = await Promise.all(threads.map(async (thread) => {
      const threadJSON = thread.toJSON();
      // Count posts for this thread
      const postCount = await Post.count({
        where: { thread_id: thread.id }
      });
      
      // Add post_count to thread object
      threadJSON.post_count = postCount;
      
      return threadJSON;
    }));
    
    res.json(threadsWithCounts);
  } catch (err) {
    console.error('Error fetching threads with counts:', err);
    res.status(500).json({ message: 'Failed to fetch threads.', error: err.message });
  }
};

// Get Thread by ID
exports.getThreadById = async (req, res) => {
  try {
    const thread = await Thread.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'username', 'role'] }]
    });
    if (!thread) return res.status(404).json({ message: 'Thread not found.' });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch thread.', error: err.message });
  }
};

// Update Thread
exports.updateThread = async (req, res) => {
  try {
    const thread = await Thread.findByPk(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found.' });
    if (thread.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this thread.' });
    }
    const { title, content, category } = req.body;
    if (title) thread.title = title;
    if (content) thread.content = content;
    if (category) thread.category = category;
    await thread.save();
    await logUserAction(req.user.id, `Updated thread: ${thread.title}`, req.clientIp);
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update thread.', error: err.message });
  }
};

// Delete Thread
exports.deleteThread = async (req, res) => {
  try {
    console.log('=== DEBUG: DELETE THREAD ===');
    console.log('Request params:', req.params);
    console.log('User from token:', req.user);

    const threadId = parseInt(req.params.id, 10);
    if (isNaN(threadId)) {
      return res.status(400).json({ message: 'Invalid thread ID format.' });
    }
    
    // Cari thread terlebih dahulu
    const thread = await Thread.findByPk(threadId);
    
    // Periksa apakah thread ada
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found.' });
    }
    
    console.log('Found thread:', thread.id, 'by user:', thread.user_id);
    
    // Periksa apakah user adalah pemilik thread atau admin
    if (thread.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this thread.' });
    }
    
    // Menggunakan SQL langsung untuk menghapus posts terlebih dahulu
    console.log(`Deleting all posts for thread ID ${threadId} using direct SQL`);
    
    // Hapus posts langsung dengan SQL query
    const [deletedPosts] = await Thread.sequelize.query(
      'DELETE FROM posts WHERE thread_id = $1 RETURNING id',
      { 
        bind: [threadId],
        type: Thread.sequelize.QueryTypes.DELETE
      }
    );
    
    console.log(`Deleted posts result:`, deletedPosts);
    
    // Hapus thread dengan SQL query juga
    const [deletedThread] = await Thread.sequelize.query(
      'DELETE FROM threads WHERE id = $1 RETURNING id',
      { 
        bind: [threadId],
        type: Thread.sequelize.QueryTypes.DELETE
      }
    );
    
    console.log(`Deleted thread result:`, deletedThread);
    
    // Log aktivitas
    await logUserAction(req.user.id, `Thread ${threadId} deleted`, req.clientIp);
    
    res.json({ message: 'Thread deleted successfully.' });
  } catch (err) {
    console.error('Error deleting thread:', err);
    
    res.status(500).json({ 
      message: 'Failed to delete thread.', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
