const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, phone, address, country, postal, password } = req.body;

    if (!username || !email || !phone || !address || !country || !postal || !password)
      return res.status(400).json({ message: 'All fields are required' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      return res.status(400).json({ message: 'Password must contain at least one letter and one number' });

    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: 'Please enter a valid email address' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    if (await User.findOne({ username }))
      return res.status(400).json({ message: 'Username already taken' });

    const user = await User.create({ username, email, phone, address, country, postal, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ message: 'Identifier and password required' });

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }]
    });

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      cart: user.cart,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(404).json({ message: 'No account found with that email' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${rawToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: `"norisxgg store" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset — norisxgg store',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#0088ff;">norisxgg store</h2>
          <h3>Password Reset Request</h3>
          <p>Hi <strong>${user.username}</strong>,</p>
          <p>You requested a password reset. Click below (link expires in 10 minutes):</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#0088ff;color:white;padding:12px 24px;
                    border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#888;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'Password reset email sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Email could not be sent: ' + err.message });
  }
};

// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });

    if (!req.body.password || req.body.password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    if (!/[a-zA-Z]/.test(req.body.password) || !/[0-9]/.test(req.body.password))
      return res.status(400).json({ message: 'Password must contain at least one letter and one number' });

    user.password = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful', token: generateToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
