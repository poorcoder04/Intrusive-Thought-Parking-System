const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Simple email format validator
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// REGISTER
exports.register = async (req, res) => {
  try {
    // Fix #5: Full input validation before touching the database
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ message: 'Name must be between 2 and 50 characters.' });
    }
    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: 'Password must be under 128 characters.' });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    });
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fix #5: Validate presence before querying DB
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Fix #18: Generic message — don't reveal whether email exists or password is wrong
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
