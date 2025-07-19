const { Post, Thread, User, Notification } = require('../models');
const logUserAction = require('../utils/logUserAction');

// Create post (comment)
exports.createPost = async (req, res) => {
  try {
    const { thread_id, content } = req.body;
    if (!thread_id || !content) {
      return res.status(400).json({ message: 'thread_id and content are required.' });
    }
    const thread = await Thread.findByPk(thread_id);
    if (!thread) return res.status(404).json({ message: 'Thread not found.' });
    const post = await Post.create({ thread_id, user_id: req.user.id, content });
    await logUserAction(req.user.id, `Created post in thread ${thread_id}`, req.clientIp);
    // Trigger notification to thread owner (if not replying to own thread)
    if (thread.user_id !== req.user.id) {
      await Notification.create({
        user_id: thread.user_id,
        type: 'reply',
        message: 'Ada balasan baru di thread Anda',
        link: `/threads/${thread_id}`
      });
    }
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post.', error: err.message });
  }
};

// Get all posts in a thread
exports.getPostsByThread = async (req, res) => {
  try {
    const { thread_id } = req.params;
    const posts = await Post.findAll({
      where: { thread_id },
      include: [{ model: User, attributes: ['id', 'username', 'role', 'profile_picture'] }],
      order: [['created_at', 'ASC']]
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts.', error: err.message });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post.' });
    }
    if (req.body.content) post.content = req.body.content;
    await post.save();
    await logUserAction(req.user.id, `Updated post ${post.id}`, req.clientIp);
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update post.', error: err.message });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post.' });
    }
    await post.destroy();
    await logUserAction(req.user.id, `Deleted post ${post.id}`, req.clientIp);
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post.', error: err.message });
  }
};

// Admin/moderator delete any post
exports.moderateDeletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    await post.destroy();
    await logUserAction(req.user.id, `Moderated delete post ${post.id}`, req.clientIp);
    res.json({ message: 'Post deleted by moderator.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post.', error: err.message });
  }
};
