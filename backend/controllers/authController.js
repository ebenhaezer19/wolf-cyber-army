const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logUserAction = require('../utils/logUserAction');

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existingUser = await User.findOne({
      where: { email },
      attributes: ['id']
    });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      hashed_password: hashedPassword,
      role: role || 'member'
    });
    // Log the registration with IP address
    await logUserAction(user.id, `User registered: ${username}`, req.clientIp);
    
    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'username', 'email', 'hashed_password', 'role', 'created_at', 'is_banned', 'profile_picture']
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (user.is_banned) {
      // Log banned user login attempt
      await logUserAction(user.id, `Banned user attempted login`, req.clientIp);
      return res.status(403).json({ message: 'Your account is banned.' });
    }
    // Gunakan hashed_password untuk verifikasi
    const valid = user.hashed_password ? await bcrypt.compare(password, user.hashed_password) : false;
    if (!valid) {
      // Log failed login attempts (important for security monitoring)
      await logUserAction(user.id, `Failed login attempt`, req.clientIp);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    // Use a default secret for development if JWT_SECRET env var is missing
    const JWT_SECRET = process.env.JWT_SECRET || 'wolf_cyber_army_dev_secret_key_2023';
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    // Log the login event with IP address
    await logUserAction(user.id, `User login`, req.clientIp);
    
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed.', error: err.message });
  }
};
