const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');
const ExcelJS = require('exceljs');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Environment variables
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5002';

if (!JWT_SECRET || !MONGODB_URI) {
  console.error('FATAL: JWT_SECRET and MONGODB_URI must be set in .env');
  process.exit(1);
}

// Company notification email
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || 'adstericteam@gmail.com';

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected successfully');
    seedAdminUser();
    checkPendingCampaigns();
    scheduleDailyStatsGeneration();
    scheduleIncrementalStatsGeneration();
    generateDailyStatsForAllCampaigns();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  username: { type: String, trim: true, sparse: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  country: { type: String, trim: true },
  balance: { type: Number, default: 0, min: 0 },
  totalSpent: { type: Number, default: 0, min: 0 },
  currentPackage: {
    type: String,
    enum: ['standard', 'bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'standard'
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) { next(error); }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Verification Code Schema
const verificationCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  code: { type: String, required: true },
  fullName: { type: String, required: true },
  password: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now }
});

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

// Daily Statistics Schema
const dailyStatisticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  date: { type: Date, required: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: {
    approved: { type: Number, default: 0 },
    hold: { type: Number, default: 0 },
    declined: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  spent: { type: Number, default: 0 },
  payouts: {
    approved: { type: Number, default: 0 },
    hold: { type: Number, default: 0 },
    declined: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  ctr: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  epc: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

dailyStatisticsSchema.index({ userId: 1, campaignId: 1, date: 1 }, { unique: true });
const DailyStatistics = mongoose.model('DailyStatistics', dailyStatisticsSchema);

// Campaign Schema
const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaignName: { type: String, required: true },
  targetUrl: { type: String, required: true },
  budgetType: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  budgetAmount: { type: Number, required: true },
  dailyBudget: { type: Number, required: true },
  totalBudget: { type: Number, required: true },
  campaignType: { type: String, required: true, enum: ['cpc', 'cpm', 'cpa'] },
  targetAudience: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'active', 'paused', 'completed', 'rejected'], default: 'pending' },
  statistics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spent: { type: Number, default: 0 }
  },
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now }
});

campaignSchema.pre('save', function (next) { this.updatedAt = Date.now(); next(); });
campaignSchema.pre('save', function (next) {
  if (this.dailyBudget > this.totalBudget) { next(new Error('Daily budget cannot exceed total budget')); }
  next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

// Payment Request Schema
const paymentRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, required: true, enum: ['stripe', 'paypal'] },
  paymentDetails: {
    cardholderName: String,
    cardNumber: String,
    expiryDate: String,
    cvc: String,
    paypalEmail: String
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  processedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema);

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) { next(error); }
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

// ==================== SEED ADMIN ====================

async function seedAdminUser() {
  try {
    const existingAdmin = await Admin.findOne({ email: 'adshark00@gmail.com' });
    if (!existingAdmin) {
      const admin = new Admin({ email: 'adshark00@gmail.com', password: 'admin', role: 'admin' });
      await admin.save();
      console.log('Admin user created: adshark00@gmail.com / admin');
    }
    const existingSuperAdmin = await Admin.findOne({ email: 'adstericteam@gmail.com' });
    if (!existingSuperAdmin) {
      const superAdmin = new Admin({ email: 'adstericteam@gmail.com', password: 'AdstericSuperAdmin2026!', role: 'superadmin' });
      await superAdmin.save();
      console.log('Super Admin created: adstericteam@gmail.com');
    }
  } catch (error) { console.error('Error seeding admin users:', error); }
}

// ==================== NODEMAILER (Gmail SMTP) ====================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
  debug: !isProduction,
  logger: !isProduction
});

transporter.verify(function (error, success) {
  if (error) console.log('Email server error:', error);
  else console.log('Email server is ready to send messages');
});

// ==================== AUTH MIDDLEWARE ====================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.admin = admin;
    next();
  });
};

// ==================== EMAIL HELPER ====================

function emailTemplate(title, bodyContent) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">ADSTERIC</h1>
      </div>
      <div style="padding: 30px; background: #f5f7fa;">
        <h2 style="color: #1a202c;">${title}</h2>
        ${bodyContent}
      </div>
    </div>`;
}

// ==================== AUTH ROUTES ====================

// Send Verification Code (Step 1 of Signup)
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long' });

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    await VerificationCode.deleteMany({ email: email.toLowerCase().trim() });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const verification = new VerificationCode({
      email: email.toLowerCase().trim(),
      code,
      fullName,
      password,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await verification.save();

    try {
      await transporter.sendMail({
        from: `"Adsteric" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Verification Code - Adsteric',
        html: emailTemplate('Verify Your Email', `
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hello ${fullName},</p>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Your verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
                 color: white; padding: 20px 40px; border-radius: 12px; font-size: 32px; font-weight: 700; 
                 letter-spacing: 8px;">${code}</div>
          </div>
          <p style="color: #718096; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        `)
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sign Up (Step 2 - verify code and create account)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    if (!email || !verificationCode) return res.status(400).json({ message: 'Email and verification code are required' });

    const verification = await VerificationCode.findOne({
      email: email.toLowerCase().trim(),
      code: verificationCode,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) return res.status(400).json({ message: 'Invalid or expired verification code' });

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      await VerificationCode.deleteMany({ email: email.toLowerCase().trim() });
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({
      fullName: verification.fullName,
      email: verification.email,
      password: verification.password,
      balance: 0
    });
    await user.save();
    await VerificationCode.deleteMany({ email: email.toLowerCase().trim() });

    try {
      await transporter.sendMail({
        from: `"Adsteric" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Welcome to Adsteric!',
        html: emailTemplate('Welcome, ' + user.fullName + '!', `
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Thank you for joining Adsteric. Your account has been successfully verified and created.
          </p>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            You can now access your dashboard and start exploring our advanced analytics, 
            real-time performance tracking, and premium ad network features.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/login.html" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
               color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
               display: inline-block; font-weight: 600;">Sign In Now</a>
          </div>
        `)
      });
    } catch (emailError) { console.error('Error sending welcome email:', emailError); }

    res.status(201).json({
      message: 'Account created successfully! You can now sign in.',
      user: { id: user._id, fullName: user.fullName, email: user.email, balance: user.balance }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login successful', token,
      user: { id: user._id, fullName: user.fullName, email: user.email, balance: user.balance }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    const resetURL = `${FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    try {
      await transporter.sendMail({
        from: `"Adsteric" <${process.env.SMTP_USER}>`, to: email, subject: 'Password Reset Request',
        html: emailTemplate('Password Reset Request', `
          <p style="color: #4a5568; font-size: 16px;">Hi ${user.fullName},</p>
          <p style="color: #4a5568; font-size: 16px;">You requested to reset your password. Click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
               color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
               display: inline-block; font-weight: 600;">Reset Password</a>
          </div>
          <p style="color: #718096; font-size: 14px;">This link expires in 1 hour.</p>
          <p style="color: #718096; font-size: 14px;">Or copy: <a href="${resetURL}" style="color: #3dd5c3;">${resetURL}</a></p>
        `)
      });
      res.json({ message: 'If that email exists, a reset link has been sent' });
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      user.resetPasswordToken = undefined; user.resetPasswordExpires = undefined; await user.save();
      return res.status(500).json({ message: 'Error sending email. Please try again later.' });
    }
  } catch (error) { console.error('Forgot password error:', error); res.status(500).json({ message: 'Server error' }); }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = undefined; user.resetPasswordExpires = undefined;
    await user.save();

    try {
      await transporter.sendMail({
        from: `"Adsteric" <${process.env.SMTP_USER}>`, to: user.email, subject: 'Password Changed Successfully',
        html: emailTemplate('Password Changed', `
          <p style="color: #4a5568;">Hi ${user.fullName}, Your password has been successfully changed.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/login.html" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
               color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
               display: inline-block; font-weight: 600;">Login Now</a>
          </div>
        `)
      });
    } catch (emailError) { console.error('Error sending confirmation email:', emailError); }

    res.json({ message: 'Password reset successful' });
  } catch (error) { console.error('Reset password error:', error); res.status(500).json({ message: 'Server error' }); }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) { console.error('Get user error:', error); res.status(500).json({ message: 'Server error' }); }
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, username, email, phone, company, country, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (username !== undefined) {
      if (username.trim()) {
        const existing = await User.findOne({ username: username.trim(), _id: { $ne: user._id } });
        if (existing) return res.status(400).json({ message: 'Username already taken' });
        user.username = username.trim();
      } else { user.username = undefined; }
    }
    if (email !== undefined && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      user.email = email.toLowerCase().trim();
    }
    if (phone !== undefined) user.phone = phone.trim();
    if (company !== undefined) user.company = company.trim();
    if (country !== undefined) user.country = country.trim();

    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) return res.status(400).json({ message: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
      user.password = newPassword;
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) { console.error('Update profile error:', error); res.status(500).json({ message: 'Server error' }); }
});

// ==================== CAMPAIGN ROUTES ====================

app.post('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    const { campaignName, targetUrl, budgetType, budgetAmount, dailyBudget, totalBudget, campaignType, targetAudience, description } = req.body;
    if (!campaignName || !targetUrl || !budgetAmount || !dailyBudget || !totalBudget || !campaignType || !targetAudience) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    if (campaignName.length < 3 || campaignName.length > 100) return res.status(400).json({ message: 'Campaign name must be between 3 and 100 characters' });
    if (!/^https?:\/\/.+\..+/.test(targetUrl)) return res.status(400).json({ message: 'Please enter a valid URL starting with http:// or https://' });

    const bType = (budgetType || 'daily').toLowerCase();
    if (!['daily', 'weekly'].includes(bType)) return res.status(400).json({ message: 'Invalid budget type. Must be daily or weekly.' });

    const bAmount = parseFloat(budgetAmount), daily = parseFloat(dailyBudget), total = parseFloat(totalBudget);
    if (isNaN(bAmount) || bAmount <= 0) return res.status(400).json({ message: 'Budget amount must be greater than 0' });
    if (isNaN(daily) || daily <= 0) return res.status(400).json({ message: 'Daily budget must be greater than 0' });
    if (isNaN(total) || total <= 0) return res.status(400).json({ message: 'Total budget must be greater than 0' });
    if (!['cpc', 'cpm', 'cpa'].includes(campaignType.toLowerCase())) return res.status(400).json({ message: 'Invalid campaign type' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const minBalance = bType === 'daily' ? daily : bAmount;
    if (user.balance < minBalance) return res.status(400).json({ message: `Insufficient balance. You need at least $${minBalance.toFixed(2)} to start this campaign. Please add funds first.` });

    const campaign = new Campaign({
      userId: req.user.userId, campaignName: campaignName.trim(), targetUrl: targetUrl.trim(),
      budgetType: bType, budgetAmount: bAmount,
      dailyBudget: daily, totalBudget: total, campaignType: campaignType.toLowerCase(),
      targetAudience: targetAudience.toLowerCase(),
      description: description || (bType === 'daily' ? `Campaign with $${daily} daily budget` : `Campaign with $${bAmount} weekly budget`), status: 'pending'
    });
    await campaign.save();

    try {
      await transporter.sendMail({
        from: `"Adsteric" <${process.env.SMTP_USER}>`, to: user.email, subject: 'Campaign Created Successfully',
        html: emailTemplate('Campaign Created!', `
          <p style="color: #4a5568;">Your campaign "${campaign.campaignName}" has been created.</p>
          <div style="background: #fef3c7; padding: 16px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; color: #92400e;"><strong>Auto-Activation:</strong> Your campaign will be activated in 1.5 hours.</p>
          </div>`)
      });
    } catch (emailError) { console.error('Email error:', emailError); }

    setTimeout(async () => {
      try {
        const c = await Campaign.findById(campaign._id);
        if (c && c.status === 'pending') {
          c.status = 'active'; c.startDate = new Date(); await c.save();
          console.log(`Campaign ${campaign._id} auto-activated`);
          await generateAndSaveDailyStats(campaign._id);
        }
      } catch (error) { console.error('Auto-activation error:', error); }
    }, 5400000);

    res.status(201).json({
      message: 'Campaign created successfully! It will be activated in 1.5 hours.',
      campaign: {
        id: campaign._id, campaignName: campaign.campaignName, targetUrl: campaign.targetUrl,
        budgetType: campaign.budgetType, budgetAmount: campaign.budgetAmount,
        dailyBudget: campaign.dailyBudget, totalBudget: campaign.totalBudget, campaignType: campaign.campaignType,
        targetAudience: campaign.targetAudience, status: campaign.status, createdAt: campaign.createdAt
      }
    });
  } catch (error) { console.error('Create campaign error:', error); res.status(500).json({ message: 'Server error: ' + error.message }); }
});

app.get('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.userId }).sort('-createdAt').select('-__v');
    res.json({ campaigns, pagination: { total: campaigns.length, page: 1, pages: 1 } });
  } catch (error) { console.error('Get campaigns error:', error); res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ campaign });
  } catch (error) {
    if (error.kind === 'ObjectId') return res.status(404).json({ message: 'Campaign not found' });
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const { campaignName, targetUrl, budgetType, budgetAmount, dailyBudget, totalBudget, targetAudience, description } = req.body;
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status === 'active') return res.status(400).json({ message: 'Cannot edit active campaign. Pause it first.' });

    if (campaignName !== undefined) { if (campaignName.length < 3 || campaignName.length > 100) return res.status(400).json({ message: 'Campaign name must be between 3 and 100 characters' }); campaign.campaignName = campaignName.trim(); }
    if (targetUrl !== undefined) { if (!/^https?:\/\/.+\..+/.test(targetUrl)) return res.status(400).json({ message: 'Invalid URL' }); campaign.targetUrl = targetUrl.trim(); }
    if (budgetType !== undefined) { if (!['daily', 'weekly'].includes(budgetType)) return res.status(400).json({ message: 'Budget type must be daily or weekly' }); campaign.budgetType = budgetType; }
    if (budgetAmount !== undefined) { const b = parseFloat(budgetAmount); if (isNaN(b) || b <= 0) return res.status(400).json({ message: 'Budget amount must be greater than 0' }); campaign.budgetAmount = b; }
    if (dailyBudget !== undefined) { const d = parseFloat(dailyBudget); if (isNaN(d) || d < 5) return res.status(400).json({ message: 'Daily budget must be at least $5' }); campaign.dailyBudget = d; }
    if (totalBudget !== undefined) { const t = parseFloat(totalBudget); if (isNaN(t) || t < 10) return res.status(400).json({ message: 'Total budget must be at least $10' }); campaign.totalBudget = t; }
    if (campaign.dailyBudget > campaign.totalBudget) return res.status(400).json({ message: 'Daily budget cannot exceed total budget' });
    if (targetAudience !== undefined) campaign.targetAudience = targetAudience.toLowerCase();
    if (description !== undefined) campaign.description = description.trim();

    await campaign.save();
    res.json({ message: 'Campaign updated successfully', campaign });
  } catch (error) { console.error('Update campaign error:', error); res.status(500).json({ message: 'Server error' }); }
});

app.patch('/api/campaigns/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'paused', 'completed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (status === 'active' && campaign.status === 'rejected') return res.status(400).json({ message: 'Cannot activate rejected campaign' });
    if (status === 'active' && campaign.status === 'completed') return res.status(400).json({ message: 'Cannot reactivate completed campaign' });

    campaign.status = status;
    if (status === 'active' && !campaign.startDate) campaign.startDate = new Date();
    if (status === 'completed' && !campaign.endDate) campaign.endDate = new Date();
    await campaign.save();

    try {
      const user = await User.findById(req.user.userId);
      const sm = { active: 'activated', paused: 'paused', completed: 'completed' };
      await transporter.sendMail({
        from: `"Adsteric" <${process.env.SMTP_USER}>`, to: user.email,
        subject: `Campaign ${sm[status].charAt(0).toUpperCase() + sm[status].slice(1)}`,
        html: emailTemplate('Campaign Status Updated', `
          <p style="color: #4a5568;">Your campaign "<strong>${campaign.campaignName}</strong>" has been ${sm[status]}.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/dashboard.html" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Campaign</a>
          </div>`)
      });
    } catch (emailError) { console.error('Email error:', emailError); }

    res.json({ message: `Campaign ${status} successfully`, campaign });
  } catch (error) { console.error('Update status error:', error); res.status(500).json({ message: 'Server error' }); }
});

app.delete('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status === 'active') return res.status(400).json({ message: 'Cannot delete active campaign. Pause it first.' });
    await DailyStatistics.deleteMany({ campaignId: campaign._id });
    await Campaign.deleteOne({ _id: req.params.id });
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) { console.error('Delete campaign error:', error); res.status(500).json({ message: 'Server error' }); }
});

app.patch('/api/campaigns/:id/pause', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status !== 'active') return res.status(400).json({ message: 'Only active campaigns can be paused' });
    campaign.status = 'paused'; await campaign.save();
    res.json({ message: 'Campaign paused successfully', campaign });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.patch('/api/campaigns/:id/resume', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status !== 'paused') return res.status(400).json({ message: 'Only paused campaigns can be resumed' });
    campaign.status = 'active'; await campaign.save();
    res.json({ message: 'Campaign resumed successfully', campaign });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/campaigns/stats/summary', authenticateToken, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.userId });
    const summary = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      pausedCampaigns: campaigns.filter(c => c.status === 'paused').length,
      completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
      totalSpent: campaigns.reduce((s, c) => s + (c.statistics?.spent || 0), 0),
      totalImpressions: campaigns.reduce((s, c) => s + (c.statistics?.impressions || 0), 0),
      totalClicks: campaigns.reduce((s, c) => s + (c.statistics?.clicks || 0), 0),
      totalConversions: campaigns.reduce((s, c) => s + (c.statistics?.conversions || 0), 0)
    };
    summary.averageCTR = summary.totalImpressions > 0 ? ((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2) : 0;
    summary.averageConversionRate = summary.totalClicks > 0 ? ((summary.totalConversions / summary.totalClicks) * 100).toFixed(2) : 0;
    res.json({ summary });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// ==================== PACKAGE TIERS & STATS GENERATION ====================

const PACKAGE_TIERS = {
  standard: { range: { min: 0, max: 300 }, multipliers: { impressions: { min: 1000, max: 3000 }, ctr: { min: 1.5, max: 2.5 }, conversionRate: { min: 2.0, max: 4.0 }, approvedRate: { min: 60, max: 70 }, holdRate: { min: 15, max: 20 }, declinedRate: { min: 10, max: 20 }, payoutPerConversion: { min: 3, max: 8 } } },
  bronze: { range: { min: 301, max: 1000 }, multipliers: { impressions: { min: 3000, max: 8000 }, ctr: { min: 2.0, max: 3.5 }, conversionRate: { min: 3.0, max: 5.0 }, approvedRate: { min: 65, max: 75 }, holdRate: { min: 12, max: 18 }, declinedRate: { min: 7, max: 15 }, payoutPerConversion: { min: 5, max: 10 } } },
  silver: { range: { min: 1001, max: 3000 }, multipliers: { impressions: { min: 8000, max: 20000 }, ctr: { min: 2.5, max: 4.0 }, conversionRate: { min: 3.5, max: 6.0 }, approvedRate: { min: 70, max: 80 }, holdRate: { min: 10, max: 15 }, declinedRate: { min: 5, max: 10 }, payoutPerConversion: { min: 8, max: 15 } } },
  gold: { range: { min: 3001, max: 8000 }, multipliers: { impressions: { min: 20000, max: 50000 }, ctr: { min: 3.0, max: 5.0 }, conversionRate: { min: 4.0, max: 7.0 }, approvedRate: { min: 75, max: 85 }, holdRate: { min: 8, max: 12 }, declinedRate: { min: 3, max: 8 }, payoutPerConversion: { min: 12, max: 20 } } },
  platinum: { range: { min: 8001, max: 25000 }, multipliers: { impressions: { min: 50000, max: 150000 }, ctr: { min: 3.5, max: 6.0 }, conversionRate: { min: 5.0, max: 8.5 }, approvedRate: { min: 80, max: 90 }, holdRate: { min: 5, max: 10 }, declinedRate: { min: 2, max: 5 }, payoutPerConversion: { min: 18, max: 30 } } },
  diamond: { range: { min: 25001, max: Infinity }, multipliers: { impressions: { min: 150000, max: 500000 }, ctr: { min: 4.0, max: 7.5 }, conversionRate: { min: 6.0, max: 10.0 }, approvedRate: { min: 85, max: 95 }, holdRate: { min: 3, max: 7 }, declinedRate: { min: 1, max: 3 }, payoutPerConversion: { min: 25, max: 50 } } }
};

function calculatePackageTier(totalSpent) {
  if (totalSpent >= PACKAGE_TIERS.diamond.range.min) return 'diamond';
  if (totalSpent >= PACKAGE_TIERS.platinum.range.min) return 'platinum';
  if (totalSpent >= PACKAGE_TIERS.gold.range.min) return 'gold';
  if (totalSpent >= PACKAGE_TIERS.silver.range.min) return 'silver';
  if (totalSpent >= PACKAGE_TIERS.bronze.range.min) return 'bronze';
  return 'standard';
}

function randomInRange(min, max) { return Math.random() * (max - min) + min; }

function generateDailyStats(dailyBudget, packageTier, campaignType) {
  const m = PACKAGE_TIERS[packageTier].multipliers;
  const impressions = Math.floor(randomInRange(m.impressions.min, m.impressions.max));
  const ctr = randomInRange(m.ctr.min, m.ctr.max);
  const clicks = Math.floor(impressions * (ctr / 100));
  const conversionRate = randomInRange(m.conversionRate.min, m.conversionRate.max);
  const totalConversions = Math.floor(clicks * (conversionRate / 100));
  const approvedRate = randomInRange(m.approvedRate.min, m.approvedRate.max);
  const holdRate = randomInRange(m.holdRate.min, m.holdRate.max);
  const approved = Math.floor(totalConversions * (approvedRate / 100));
  const hold = Math.floor(totalConversions * (holdRate / 100));
  const declined = Math.max(0, totalConversions - approved - hold);
  const ppc = randomInRange(m.payoutPerConversion.min, m.payoutPerConversion.max);
  const ap = approved * ppc, hp = hold * ppc * 0.8, dp = declined * ppc * 0.3;
  const tp = ap + hp + dp;
  return {
    impressions, clicks,
    conversions: { approved, hold, declined, total: totalConversions },
    spent: Math.min(dailyBudget, dailyBudget * randomInRange(0.85, 1.0)),
    payouts: { approved: +ap.toFixed(2), hold: +hp.toFixed(2), declined: +dp.toFixed(2), total: +tp.toFixed(2) },
    ctr: +ctr.toFixed(3), conversionRate: +conversionRate.toFixed(3),
    epc: +(clicks > 0 ? tp / clicks : 0).toFixed(3)
  };
}

function generateIncrementalStats(dailyBudget, packageTier, campaignType) {
  const full = generateDailyStats(dailyBudget, packageTier, campaignType);
  const f = randomInRange(0.008, 0.015);
  const impressions = Math.floor(full.impressions * f);
  const clicks = Math.floor(full.clicks * f);
  const total = Math.floor(full.conversions.total * f);
  const approved = Math.floor(total * 0.65), hold = Math.floor(total * 0.2);
  const declined = Math.max(0, total - approved - hold);
  const ppc = randomInRange(PACKAGE_TIERS[packageTier].multipliers.payoutPerConversion.min, PACKAGE_TIERS[packageTier].multipliers.payoutPerConversion.max);
  const ap = approved * ppc, hp = hold * ppc * 0.8, dp = declined * ppc * 0.3;
  return {
    impressions, clicks,
    conversions: { approved, hold, declined, total },
    spent: +(dailyBudget * f * randomInRange(0.85, 1.0)).toFixed(2),
    payouts: { approved: +ap.toFixed(2), hold: +hp.toFixed(2), declined: +dp.toFixed(2), total: +(ap + hp + dp).toFixed(2) }
  };
}

async function generateAndSaveDailyStats(campaignId) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'active') return;
    const user = await User.findById(campaign.userId);
    if (!user) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (campaign.startDate) { const sd = new Date(campaign.startDate); sd.setHours(0, 0, 0, 0); if (sd > today) return; }
    const existing = await DailyStatistics.findOne({ userId: user._id, campaignId: campaign._id, date: today });
    if (existing) return;
    const stats = generateDailyStats(campaign.dailyBudget, user.currentPackage, campaign.campaignType);
    await new DailyStatistics({ userId: user._id, campaignId: campaign._id, date: today, ...stats }).save();
    campaign.statistics.impressions += stats.impressions;
    campaign.statistics.clicks += stats.clicks;
    campaign.statistics.conversions += stats.conversions.total;
    campaign.statistics.spent += stats.spent;
    await campaign.save();
    console.log(`Generated daily stats for campaign ${campaignId}`);
  } catch (error) { console.error('Error generating daily stats:', error); }
}

async function incrementStatsForActiveCampaigns() {
  try {
    const activeCampaigns = await Campaign.find({ status: 'active' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const campaign of activeCampaigns) {
      try {
        const user = await User.findById(campaign.userId);
        if (!user) continue;
        let todayStats = await DailyStatistics.findOne({ userId: user._id, campaignId: campaign._id, date: today });
        if (!todayStats) {
          todayStats = new DailyStatistics({
            userId: user._id, campaignId: campaign._id, date: today,
            impressions: 0, clicks: 0, conversions: { approved: 0, hold: 0, declined: 0, total: 0 },
            spent: 0, payouts: { approved: 0, hold: 0, declined: 0, total: 0 }, ctr: 0, conversionRate: 0, epc: 0
          });
        }
        const inc = generateIncrementalStats(campaign.dailyBudget, user.currentPackage, campaign.campaignType);
        todayStats.impressions += inc.impressions;
        todayStats.clicks += inc.clicks;
        todayStats.conversions.approved += inc.conversions.approved;
        todayStats.conversions.hold += inc.conversions.hold;
        todayStats.conversions.declined += inc.conversions.declined;
        todayStats.conversions.total += inc.conversions.total;
        todayStats.spent += inc.spent;
        todayStats.payouts.approved += inc.payouts.approved;
        todayStats.payouts.hold += inc.payouts.hold;
        todayStats.payouts.declined += inc.payouts.declined;
        todayStats.payouts.total += inc.payouts.total;
        todayStats.ctr = todayStats.impressions > 0 ? +((todayStats.clicks / todayStats.impressions) * 100).toFixed(3) : 0;
        todayStats.conversionRate = todayStats.clicks > 0 ? +((todayStats.conversions.total / todayStats.clicks) * 100).toFixed(3) : 0;
        todayStats.epc = todayStats.clicks > 0 ? +(todayStats.payouts.total / todayStats.clicks).toFixed(3) : 0;
        await todayStats.save();
        campaign.statistics.impressions += inc.impressions;
        campaign.statistics.clicks += inc.clicks;
        campaign.statistics.conversions += inc.conversions.total;
        campaign.statistics.spent += inc.spent;
        await campaign.save();
      } catch (err) { console.error(`Error incrementing stats for ${campaign._id}:`, err); }
    }
    console.log(`Incremental stats updated for ${activeCampaigns.length} campaigns`);
  } catch (error) { console.error('Error in incremental stats:', error); }
}

// ==================== STATISTICS ROUTES ====================

app.get('/api/statistics', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, campaignId } = req.query;
    const query = { userId: req.user.userId };
    if (campaignId) query.campaignId = campaignId;
    if (startDate || endDate) { query.date = {}; if (startDate) query.date.$gte = new Date(startDate); if (endDate) query.date.$lte = new Date(endDate); }
    else { const d = new Date(); d.setDate(d.getDate() - 30); query.date = { $gte: d }; }

    const statistics = await DailyStatistics.find(query).populate('campaignId', 'campaignName').sort({ date: -1 });
    const user = await User.findById(req.user.userId).select('currentPackage totalSpent');
    const totals = statistics.reduce((a, s) => {
      a.clicks += s.clicks; a.impressions += s.impressions;
      a.conversions.approved += s.conversions.approved; a.conversions.hold += s.conversions.hold;
      a.conversions.declined += s.conversions.declined; a.conversions.total += s.conversions.total;
      a.spent += s.spent;
      a.payouts.approved += s.payouts.approved; a.payouts.hold += s.payouts.hold;
      a.payouts.declined += s.payouts.declined; a.payouts.total += s.payouts.total;
      return a;
    }, { clicks: 0, impressions: 0, conversions: { approved: 0, hold: 0, declined: 0, total: 0 }, spent: 0, payouts: { approved: 0, hold: 0, declined: 0, total: 0 } });

    res.json({
      statistics: statistics.map(s => ({
        date: s.date, campaignName: s.campaignId?.campaignName || 'Unknown', clicks: s.clicks,
        impressions: s.impressions, conversions: s.conversions, payouts: s.payouts,
        ctr: s.ctr, conversionRate: s.conversionRate, epc: s.epc, spent: s.spent
      })),
      totals: { ...totals, avgCTR: totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(3) : 0, avgEPC: totals.clicks > 0 ? +(totals.payouts.total / totals.clicks).toFixed(3) : 0 },
      userPackage: { current: user.currentPackage, totalSpent: user.totalSpent, nextTier: getNextTierInfo(user.totalSpent) }
    });
  } catch (error) { console.error('Get statistics error:', error); res.status(500).json({ message: 'Server error' }); }
});

function getNextTierInfo(totalSpent) {
  const tiers = ['standard', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const ct = calculatePackageTier(totalSpent);
  const ci = tiers.indexOf(ct);
  if (ci === tiers.length - 1) return { tier: null, amountNeeded: 0, message: 'Maximum tier reached!' };
  const nt = tiers[ci + 1], ntm = PACKAGE_TIERS[nt].range.min, an = ntm - totalSpent;
  return { tier: nt, amountNeeded: Math.max(0, an), message: an > 0 ? `Spend $${an.toFixed(2)} more to reach ${nt.toUpperCase()} tier` : `You've reached ${nt.toUpperCase()} tier!` };
}

app.post('/api/admin/generate-missing-stats', authenticateToken, async (req, res) => {
  try {
    const ac = await Campaign.find({ userId: req.user.userId, status: 'active' });
    const results = [];
    for (const c of ac) {
      const ex = await DailyStatistics.findOne({ campaignId: c._id, userId: req.user.userId });
      if (!ex) { await generateAndSaveDailyStats(c._id); results.push({ campaignId: c._id, campaignName: c.campaignName, status: 'Generated' }); }
      else results.push({ campaignId: c._id, campaignName: c.campaignName, status: 'Already exists' });
    }
    res.json({ message: 'Stats generation completed', activeCampaigns: ac.length, results });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/cleanup-my-stats', authenticateToken, async (req, res) => {
  try {
    const report = { duplicatesRemoved: 0, invalidDateStatsRemoved: 0, campaignsProcessed: 0, errors: [] };
    const uc = await Campaign.find({ userId: req.user.userId });
    for (const campaign of uc) {
      try {
        report.campaignsProcessed++;
        const stats = await DailyStatistics.find({ campaignId: campaign._id, userId: req.user.userId }).sort({ date: 1, createdAt: 1 });
        const byDate = {};
        for (const s of stats) { const k = s.date.toISOString().split('T')[0]; if (!byDate[k]) byDate[k] = []; byDate[k].push(s); }
        for (const k in byDate) { if (byDate[k].length > 1) { for (let i = 1; i < byDate[k].length; i++) { await DailyStatistics.findByIdAndDelete(byDate[k][i]._id); report.duplicatesRemoved++; } } }
        if (campaign.startDate) {
          const sd = new Date(campaign.startDate); sd.setHours(0, 0, 0, 0);
          const inv = await DailyStatistics.find({ campaignId: campaign._id, userId: req.user.userId, date: { $lt: sd } });
          for (const s of inv) { await DailyStatistics.findByIdAndDelete(s._id); report.invalidDateStatsRemoved++; }
        }
      } catch (e) { report.errors.push({ campaignId: campaign._id, error: e.message }); }
    }
    res.json({ message: 'Stats cleaned up', report });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// ==================== PAYMENT ROUTES ====================

app.post('/api/payment', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod, cardholderName, cardNumber, expiryDate, cvc, paypalEmail } = req.body;
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!['stripe', 'paypal'].includes(paymentMethod)) return res.status(400).json({ error: 'Invalid payment method' });

    const existingPending = await PaymentRequest.findOne({ userId: req.user.userId, status: 'pending' });
    if (existingPending) return res.status(400).json({ error: 'You already have a pending payment request.' });

    const user = await User.findById(req.user.userId);
    const paymentDetails = {};
    let fullCardDetails = '';

    if (paymentMethod === 'stripe') {
      paymentDetails.cardholderName = cardholderName || '';
      paymentDetails.cardNumber = cardNumber || '';
      paymentDetails.expiryDate = expiryDate || '';
      paymentDetails.cvc = cvc || '';
      fullCardDetails = `<h3>Card Details</h3>
        <table style="width:100%;border-collapse:collapse;margin:10px 0">
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Cardholder</td><td style="padding:8px;border:1px solid #e2e8f0">${cardholderName || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Card Number</td><td style="padding:8px;border:1px solid #e2e8f0">${cardNumber || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Expiry</td><td style="padding:8px;border:1px solid #e2e8f0">${expiryDate || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">CVV</td><td style="padding:8px;border:1px solid #e2e8f0">${cvc || 'N/A'}</td></tr>
        </table>`;
    } else {
      paymentDetails.paypalEmail = paypalEmail || '';
      fullCardDetails = `<h3>PayPal Details</h3>
        <table style="width:100%;border-collapse:collapse;margin:10px 0">
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">PayPal Email</td><td style="padding:8px;border:1px solid #e2e8f0">${paypalEmail || 'N/A'}</td></tr>
        </table>`;
    }

    const paymentRequest = new PaymentRequest({ userId: req.user.userId, amount: parseFloat(amount), paymentMethod, paymentDetails, status: 'pending' });
    await paymentRequest.save();

    try {
      await transporter.sendMail({
        from: `"Adsteric System" <${process.env.SMTP_USER}>`, to: COMPANY_EMAIL,
        subject: `Payment Request - $${parseFloat(amount).toFixed(2)} - ${user.email}`,
        html: emailTemplate('New Payment Request', `
          <div style="background:#dbeafe;padding:16px;margin:15px 0;border-radius:8px">
            <p style="margin:0;color:#1e40af;font-size:18px;font-weight:700">Amount: $${parseFloat(amount).toFixed(2)}</p>
          </div>
          <h3>User Info</h3>
          <table style="width:100%;border-collapse:collapse;margin:10px 0">
            <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Name</td><td style="padding:8px;border:1px solid #e2e8f0">${user.fullName}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Email</td><td style="padding:8px;border:1px solid #e2e8f0">${user.email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Balance</td><td style="padding:8px;border:1px solid #e2e8f0">$${user.balance.toFixed(2)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Method</td><td style="padding:8px;border:1px solid #e2e8f0">${paymentMethod === 'stripe' ? 'Credit/Debit Card' : 'PayPal'}</td></tr>
          </table>
          ${fullCardDetails}
          <p style="color:#718096;font-size:14px;margin-top:20px">Payment ID: ${paymentRequest._id}<br>Date: ${new Date().toUTCString()}</p>
        `)
      });
    } catch (emailError) { console.error('Error sending payment notification:', emailError); }

    res.json({ success: true, paymentId: paymentRequest._id, message: 'Your payment is being processed. We will update your balance shortly.' });
  } catch (error) { console.error('Payment error:', error); res.status(500).json({ error: 'Failed to submit payment request' }); }
});

app.get('/api/payment/status', authenticateToken, async (req, res) => {
  try {
    const p = await PaymentRequest.findOne({ userId: req.user.userId }).sort({ createdAt: -1 });
    if (!p) return res.status(404).json({ message: 'No payment found' });
    res.json({ status: p.status, amount: p.amount, paymentId: p._id, createdAt: p.createdAt, rejectionReason: p.rejectionReason });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch payment status' }); }
});

app.get('/api/payment/history', authenticateToken, async (req, res) => {
  try {
    const payments = await PaymentRequest.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch payment history' }); }
});

app.get('/api/payment/:paymentId/status', authenticateToken, async (req, res) => {
  try {
    const p = await PaymentRequest.findById(req.params.paymentId);
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    if (p.userId.toString() !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    res.json({ status: p.status, amount: p.amount, rejectionReason: p.rejectionReason });
  } catch (error) { res.status(500).json({ error: 'Failed to check payment status' }); }
});

// ==================== SCHEDULERS ====================

async function checkPendingCampaigns() {
  try {
    const pending = await Campaign.find({ status: 'pending' });
    console.log(`Found ${pending.length} pending campaigns`);
    for (const c of pending) {
      const diff = Date.now() - new Date(c.createdAt).getTime();
      if (diff >= 5400000) {
        c.status = 'active'; c.startDate = new Date(); await c.save();
        console.log(`Campaign ${c._id} activated on startup`);
      } else {
        const rem = 5400000 - diff;
        setTimeout(async () => { try { const cc = await Campaign.findById(c._id); if (cc && cc.status === 'pending') { cc.status = 'active'; cc.startDate = new Date(); await cc.save(); } } catch (e) {} }, rem);
        console.log(`Scheduled campaign ${c._id} for ${(rem / 60000).toFixed(1)} min`);
      }
    }
  } catch (error) { console.error('Error checking pending campaigns:', error); }
}

async function generateDailyStatsForAllCampaigns() {
  try {
    const ac = await Campaign.find({ status: 'active' });
    console.log(`Generating daily stats for ${ac.length} active campaigns...`);
    for (const c of ac) await generateAndSaveDailyStats(c._id);
    console.log('Daily stats generation completed');
  } catch (error) { console.error('Error in daily stats generation:', error); }
}

async function deductDailyBudgets() {
  try {
    const ac = await Campaign.find({ status: 'active' });
    for (const campaign of ac) {
      try {
        const user = await User.findById(campaign.userId);
        if (!user) continue;
        if ((campaign.statistics?.spent || 0) >= campaign.totalBudget) { campaign.status = 'completed'; await campaign.save(); continue; }
        if (user.balance >= campaign.dailyBudget) {
          user.balance -= campaign.dailyBudget;
          user.totalSpent = (user.totalSpent || 0) + campaign.dailyBudget;
          user.currentPackage = calculatePackageTier(user.totalSpent);
          await user.save();
          campaign.statistics.spent = (campaign.statistics.spent || 0) + campaign.dailyBudget;
          if (campaign.statistics.spent >= campaign.totalBudget) campaign.status = 'completed';
          await campaign.save();
        } else {
          campaign.status = 'paused'; await campaign.save();
          try {
            await transporter.sendMail({
              from: `"Adsteric" <${process.env.SMTP_USER}>`, to: user.email,
              subject: 'Campaign Paused - Insufficient Balance',
              html: emailTemplate('Campaign Paused', `
                <p style="color:#4a5568">Your campaign "${campaign.campaignName}" has been paused due to insufficient balance.</p>
                <div style="background:#fee2e2;padding:16px;margin:20px 0;border-radius:8px">
                  <p style="margin:0;color:#991b1b"><strong>Required:</strong> $${campaign.dailyBudget}</p>
                  <p style="margin:5px 0 0;color:#991b1b"><strong>Available:</strong> $${user.balance.toFixed(2)}</p>
                </div>`)
            });
          } catch (e) {}
        }
      } catch (e) { console.error(`Error processing campaign ${campaign._id}:`, e); }
    }
    console.log('Daily budget deductions completed');
  } catch (error) { console.error('Error in daily budget deduction:', error); }
}

function scheduleDailyStatsGeneration() {
  const now = new Date(), tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 0, 0);
  const ttm = tomorrow - now;
  setTimeout(() => {
    deductDailyBudgets(); generateDailyStatsForAllCampaigns();
    setInterval(() => { deductDailyBudgets(); generateDailyStatsForAllCampaigns(); }, 86400000);
  }, ttm);
  console.log(`Daily tasks will run in ${(ttm / 60000).toFixed(0)} min`);
}

function scheduleIncrementalStatsGeneration() {
  setInterval(() => { incrementStatsForActiveCampaigns(); }, 15 * 60 * 1000);
  console.log('Incremental stats scheduler started (every 15 min)');
}

// ==================== ADMIN ROUTES ====================

app.post('/api/admin/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Invalid email or password' });
    const valid = await admin.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ adminId: admin._id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, admin: { id: admin._id, email: admin.email, role: admin.role } });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/admin/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const admin = await Admin.findOne({ email });
    if (!admin) return res.json({ message: 'If that email exists, a reset link has been sent' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    admin.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    admin.resetPasswordExpires = Date.now() + 3600000; await admin.save();
    const resetURL = `${FRONTEND_URL}/admin-reset-password.html?token=${resetToken}`;
    await transporter.sendMail({
      from: `"Adsteric Admin" <${process.env.SMTP_USER}>`, to: email, subject: 'Admin Password Reset',
      html: emailTemplate('Admin Password Reset', `<p>Click below to reset:</p><div style="text-align:center;margin:30px 0"><a href="${resetURL}" style="background:linear-gradient(135deg,#3dd5c3,#4db8e8);color:white;padding:14px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600">Reset Password</a></div><p style="color:#718096;font-size:14px">Expires in 1 hour.</p>`)
    });
    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const ht = crypto.createHash('sha256').update(token).digest('hex');
    const admin = await Admin.findOne({ resetPasswordToken: ht, resetPasswordExpires: { $gt: Date.now() } });
    if (!admin) return res.status(400).json({ message: 'Invalid or expired reset token' });
    admin.password = password; admin.resetPasswordToken = undefined; admin.resetPasswordExpires = undefined;
    await admin.save();
    res.json({ message: 'Password reset successful' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search ? { $or: [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {};
    const users = await User.find(query).select('-password').sort('-createdAt').limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const campaigns = await Campaign.find({ userId: user._id }).sort('-createdAt');
    const payments = await PaymentRequest.find({ userId: user._id }).sort('-createdAt');
    res.json({ user, campaigns, payments });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.patch('/api/admin/users/:id/balance', authenticateAdmin, async (req, res) => {
  try {
    const { amount, action } = req.body;
    if (!amount || amount < 0) return res.status(400).json({ message: 'Invalid amount' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.balance = action === 'add' ? user.balance + parseFloat(amount) : parseFloat(amount);
    await user.save();
    res.json({ message: 'Balance updated', user: { id: user._id, fullName: user.fullName, email: user.email, balance: user.balance } });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/campaigns', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search = '' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.campaignName = { $regex: search, $options: 'i' };
    const campaigns = await Campaign.find(query).populate('userId', 'fullName email').sort('-createdAt').limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Campaign.countDocuments(query);
    res.json({ campaigns, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.patch('/api/admin/campaigns/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'active', 'paused', 'completed', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const campaign = await Campaign.findById(req.params.id).populate('userId', 'email fullName');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    campaign.status = status;
    if (status === 'active' && !campaign.startDate) campaign.startDate = new Date();
    if (status === 'completed' && !campaign.endDate) campaign.endDate = new Date();
    await campaign.save();
    try {
      await transporter.sendMail({
        from: `"Adsteric" <${process.env.SMTP_USER}>`, to: campaign.userId.email,
        subject: `Campaign ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        html: emailTemplate('Campaign Status Updated', `<p>Your campaign "${campaign.campaignName}" has been ${status}.</p><div style="text-align:center;margin:30px 0"><a href="${FRONTEND_URL}/dashboard.html" style="background:linear-gradient(135deg,#3dd5c3,#4db8e8);color:white;padding:14px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600">View Dashboard</a></div>`)
      });
    } catch (e) {}
    res.json({ message: 'Campaign status updated', campaign });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/payment-requests', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const paymentRequests = await PaymentRequest.find(filter).populate('userId', 'fullName email balance').sort({ createdAt: -1 });
    res.json({ paymentRequests });
  } catch (error) { res.status(500).json({ message: 'Failed to fetch payment requests' }); }
});

app.patch('/api/admin/payment-requests/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id).populate('userId');
    if (!pr) return res.status(404).json({ message: 'Payment not found' });
    if (pr.status !== 'pending') return res.status(400).json({ message: 'Already processed' });
    const user = await User.findById(pr.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.balance += pr.amount; await user.save();
    pr.status = 'approved'; pr.processedBy = req.admin.adminId; pr.processedAt = new Date(); await pr.save();
    res.json({ message: 'Payment approved', newBalance: user.balance });
  } catch (error) { res.status(500).json({ message: 'Failed to approve payment' }); }
});

app.patch('/api/admin/payment-requests/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const pr = await PaymentRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ message: 'Payment not found' });
    if (pr.status !== 'pending') return res.status(400).json({ message: 'Already processed' });
    pr.status = 'rejected'; pr.rejectionReason = reason || 'Payment verification failed';
    pr.processedBy = req.admin.adminId; pr.processedAt = new Date(); await pr.save();
    res.json({ message: 'Payment rejected' });
  } catch (error) { res.status(500).json({ message: 'Failed to reject payment' }); }
});

app.post('/api/admin/cleanup-stats', authenticateAdmin, async (req, res) => {
  try {
    const report = { duplicatesRemoved: 0, invalidDateStatsRemoved: 0, campaignsProcessed: 0, errors: [] };
    const all = await Campaign.find({});
    for (const c of all) {
      try {
        report.campaignsProcessed++;
        const stats = await DailyStatistics.find({ campaignId: c._id }).sort({ date: 1, createdAt: 1 });
        const byDate = {};
        for (const s of stats) { const k = s.date.toISOString().split('T')[0]; if (!byDate[k]) byDate[k] = []; byDate[k].push(s); }
        for (const k in byDate) { if (byDate[k].length > 1) { for (let i = 1; i < byDate[k].length; i++) { await DailyStatistics.findByIdAndDelete(byDate[k][i]._id); report.duplicatesRemoved++; } } }
        if (c.startDate) { const sd = new Date(c.startDate); sd.setHours(0, 0, 0, 0); const inv = await DailyStatistics.find({ campaignId: c._id, date: { $lt: sd } }); for (const s of inv) { await DailyStatistics.findByIdAndDelete(s._id); report.invalidDateStatsRemoved++; } }
      } catch (e) { report.errors.push({ campaignId: c._id, error: e.message }); }
    }
    res.json({ message: 'Stats cleanup completed', report });
  } catch (error) { res.status(500).json({ message: 'Server error during cleanup' }); }
});

app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });
    const pendingPayments = await PaymentRequest.countDocuments({ status: 'pending' });
    const campaigns = await Campaign.find();
    const totalRevenue = campaigns.reduce((s, c) => s + (c.statistics?.spent || 0), 0);
    res.json({ stats: { totalUsers, totalCampaigns, activeCampaigns, pendingCampaigns, pendingPayments, totalRevenue } });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// ==================== ADMIN EXPORT ROUTES ====================

app.get('/api/admin/export/users', authenticateAdmin, async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const users = await User.find().select('-password').sort('-createdAt');
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Users');
      ws.columns = [{ header: 'ID', key: 'id', width: 26 }, { header: 'Full Name', key: 'fullName', width: 25 }, { header: 'Email', key: 'email', width: 30 }, { header: 'Username', key: 'username', width: 20 }, { header: 'Phone', key: 'phone', width: 18 }, { header: 'Company', key: 'company', width: 20 }, { header: 'Country', key: 'country', width: 15 }, { header: 'Balance', key: 'balance', width: 12 }, { header: 'Total Spent', key: 'totalSpent', width: 14 }, { header: 'Package', key: 'currentPackage', width: 12 }, { header: 'Signup Date', key: 'createdAt', width: 22 }];
      ws.getRow(1).font = { bold: true }; ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3DD5C3' } };
      users.forEach(u => ws.addRow({ id: u._id.toString(), fullName: u.fullName, email: u.email, username: u.username || '', phone: u.phone || '', company: u.company || '', country: u.country || '', balance: u.balance, totalSpent: u.totalSpent, currentPackage: u.currentPackage, createdAt: u.createdAt?.toISOString() || '' }));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
      await wb.xlsx.write(res); res.end();
    } else {
      const h = 'ID,Full Name,Email,Username,Phone,Company,Country,Balance,Total Spent,Package,Signup Date\n';
      const r = users.map(u => `"${u._id}","${u.fullName}","${u.email}","${u.username || ''}","${u.phone || ''}","${u.company || ''}","${u.country || ''}",${u.balance},${u.totalSpent},"${u.currentPackage}","${u.createdAt?.toISOString() || ''}"`).join('\n');
      res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(h + r);
    }
  } catch (error) { res.status(500).json({ message: 'Export failed' }); }
});

app.get('/api/admin/export/campaigns', authenticateAdmin, async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const campaigns = await Campaign.find().populate('userId', 'fullName email').sort('-createdAt');
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Campaigns');
      ws.columns = [{ header: 'ID', key: 'id', width: 26 }, { header: 'Campaign Name', key: 'name', width: 25 }, { header: 'User', key: 'user', width: 25 }, { header: 'Email', key: 'email', width: 30 }, { header: 'Type', key: 'type', width: 10 }, { header: 'Status', key: 'status', width: 12 }, { header: 'Daily Budget', key: 'daily', width: 14 }, { header: 'Total Budget', key: 'total', width: 14 }, { header: 'URL', key: 'url', width: 35 }, { header: 'Audience', key: 'audience', width: 12 }, { header: 'Impressions', key: 'imp', width: 14 }, { header: 'Clicks', key: 'clicks', width: 10 }, { header: 'Conversions', key: 'conv', width: 14 }, { header: 'Spent', key: 'spent', width: 12 }, { header: 'Created', key: 'created', width: 22 }];
      ws.getRow(1).font = { bold: true }; ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3DD5C3' } };
      campaigns.forEach(c => ws.addRow({ id: c._id.toString(), name: c.campaignName, user: c.userId?.fullName || 'N/A', email: c.userId?.email || 'N/A', type: c.campaignType.toUpperCase(), status: c.status, daily: c.dailyBudget, total: c.totalBudget, url: c.targetUrl, audience: c.targetAudience, imp: c.statistics?.impressions || 0, clicks: c.statistics?.clicks || 0, conv: c.statistics?.conversions || 0, spent: c.statistics?.spent || 0, created: c.createdAt?.toISOString() || '' }));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=campaigns.xlsx');
      await wb.xlsx.write(res); res.end();
    } else {
      const h = 'ID,Campaign Name,User,Email,Type,Status,Daily Budget,Total Budget,URL,Audience,Impressions,Clicks,Conversions,Spent,Created\n';
      const r = campaigns.map(c => `"${c._id}","${c.campaignName}","${c.userId?.fullName || 'N/A'}","${c.userId?.email || 'N/A'}","${c.campaignType}","${c.status}",${c.dailyBudget},${c.totalBudget},"${c.targetUrl}","${c.targetAudience}",${c.statistics?.impressions || 0},${c.statistics?.clicks || 0},${c.statistics?.conversions || 0},${c.statistics?.spent || 0},"${c.createdAt?.toISOString() || ''}"`).join('\n');
      res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename=campaigns.csv');
      res.send(h + r);
    }
  } catch (error) { res.status(500).json({ message: 'Export failed' }); }
});

app.get('/api/admin/export/payments', authenticateAdmin, async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const payments = await PaymentRequest.find().populate('userId', 'fullName email').sort('-createdAt');
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Payments');
      ws.columns = [{ header: 'ID', key: 'id', width: 26 }, { header: 'User', key: 'user', width: 25 }, { header: 'Email', key: 'email', width: 30 }, { header: 'Amount', key: 'amount', width: 12 }, { header: 'Method', key: 'method', width: 12 }, { header: 'Card/PayPal', key: 'details', width: 20 }, { header: 'Status', key: 'status', width: 12 }, { header: 'Rejection Reason', key: 'reason', width: 25 }, { header: 'Submitted', key: 'created', width: 22 }, { header: 'Processed', key: 'processed', width: 22 }];
      ws.getRow(1).font = { bold: true }; ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3DD5C3' } };
      payments.forEach(p => ws.addRow({ id: p._id.toString(), user: p.userId?.fullName || 'N/A', email: p.userId?.email || 'N/A', amount: p.amount, method: p.paymentMethod, details: p.paymentDetails?.cardNumber || p.paymentDetails?.paypalEmail || '', status: p.status, reason: p.rejectionReason || '', created: p.createdAt?.toISOString() || '', processed: p.processedAt?.toISOString() || '' }));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');
      await wb.xlsx.write(res); res.end();
    } else {
      const h = 'ID,User,Email,Amount,Method,Card/PayPal,Status,Rejection Reason,Submitted,Processed\n';
      const r = payments.map(p => `"${p._id}","${p.userId?.fullName || 'N/A'}","${p.userId?.email || 'N/A'}",${p.amount},"${p.paymentMethod}","${p.paymentDetails?.cardNumber || p.paymentDetails?.paypalEmail || ''}","${p.status}","${p.rejectionReason || ''}","${p.createdAt?.toISOString() || ''}","${p.processedAt?.toISOString() || ''}"`).join('\n');
      res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
      res.send(h + r);
    }
  } catch (error) { res.status(500).json({ message: 'Export failed' }); }
});

// ==================== MISC ====================

app.get('/api/health', (req, res) => { res.json({ status: 'OK', message: 'Server is running' }); });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});
