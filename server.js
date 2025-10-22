const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files

// Environment variables
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adshark00:0KKX2YSBGY9Zrz21@cluster0.g7lpz.mongodb.net/adsteric?retryWrites=true&w=majority&appName=Cluster0';
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5002';

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected successfully');
    seedAdminUser(); // ADD THIS LINE
      checkPendingCampaigns(); // ADD THIS LINE
        scheduleDailyStatsGeneration();  // NEW: Start daily stats scheduler
    
    // Generate stats for existing active campaigns on startup
    generateDailyStatsForAllCampaigns();  // NEW

  })
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {  // NEW: Track total lifetime spending
    type: Number,
    default: 0,
    min: 0
  },
  currentPackage: {  // NEW: Current package tier
    type: String,
    enum: ['standard', 'bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'standard'
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
// Daily Statistics Schema
const dailyStatisticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // Raw metrics
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: {
    approved: { type: Number, default: 0 },
    hold: { type: Number, default: 0 },
    declined: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  // Financial metrics
  spent: { type: Number, default: 0 },
  payouts: {
    approved: { type: Number, default: 0 },
    hold: { type: Number, default: 0 },
    declined: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  // Calculated metrics
  ctr: { type: Number, default: 0 }, // Click-through rate
  conversionRate: { type: Number, default: 0 },
  epc: { type: Number, default: 0 }, // Earnings per click
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
dailyStatisticsSchema.index({ userId: 1, campaignId: 1, date: 1 }, { unique: true });

const DailyStatistics = mongoose.model('DailyStatistics', dailyStatisticsSchema);
// Campaign Schema
const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignName: {
    type: String,
    required: true
  },
  targetUrl: {
    type: String,
    required: true
  },
  dailyBudget: {
    type: Number,
    required: true
  },
  totalBudget: {
    type: Number,
    required: true
  },
  campaignType: {
    type: String,
    required: true,
    enum: ['cpc', 'cpm', 'cpa']
  },
  targetAudience: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'completed'],
    default: 'pending'
  },
  statistics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spent: { type: Number, default: 0 }
  },
  startDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});


// Update timestamp on save
campaignSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Validate budget constraints
campaignSchema.pre('save', function (next) {
  if (this.dailyBudget > this.totalBudget) {
    next(new Error('Daily budget cannot exceed total budget'));
  }
  next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);
const paymentRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal']
  },
  paymentDetails: {
    cardNumber: String,
    expiryDate: String,
    paypalEmail: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema);

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'admin'
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

async function seedAdminUser() {
  try {
    const existingAdmin = await Admin.findOne({ email: 'adshark00@gmail.com' });
    if (!existingAdmin) {
      const admin = new Admin({
        email: 'adshark00@gmail.com',
        password: 'admin'
      });
      await admin.save();
      console.log('Admin user created: adshark00@gmail.com / admin');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}
// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'adshark00@gmail.com',
    pass: 'iasy nmqs bzpa favn',
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
  debug: !isProduction,
  logger: !isProduction
});

// Verify email configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('Email server error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.admin = admin;
    next();
  });
};
// Routes

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      fullName,
      email,
      password,
      balance: 100.00  // ÃƒÂ¢Ã¢â‚¬Â Ã‚Â ADD THIS LINE
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email
    try {
      await transporter.sendMail({
        from: '"Adsteric" <adshark00@gmail.com>',
        to: email,
        subject: 'Welcome to Adsteric!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">ADSTERIC</h1>
            </div>
            <div style="padding: 30px; background: #f5f7fa;">
              <h2 style="color: #1a202c;">Welcome, ${fullName}!</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Thank you for joining Adsteric. Your account has been successfully created.
              </p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                You can now access your dashboard and start exploring our advanced analytics, 
                real-time performance tracking, and premium ad network features.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
                   color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
                   display: inline-block; font-weight: 600;">
                  Get Started
                </a>
              </div>
              <p style="color: #718096; font-size: 14px;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        balance: user.balance  // ÃƒÂ¢Ã¢â‚¬Â Ã‚Â ADD THIS LINE

      }
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

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Forgot Password - Request Reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create reset URL
    const resetURL = `${FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    // Send email
    try {
      await transporter.sendMail({
        from: '"Adsteric" <adshark00@gmail.com>',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">ADSTERIC</h1>
            </div>
            <div style="padding: 30px; background: #f5f7fa;">
              <h2 style="color: #1a202c;">Password Reset Request</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi ${user.fullName},
              </p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                You requested to reset your password. Click the button below to create a new password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
                   color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
                   display: inline-block; font-weight: 600;">
                  Reset Password
                </a>
              </div>
              <p style="color: #718096; font-size: 14px;">
                This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </p>
              <p style="color: #718096; font-size: 14px;">
                Or copy this link: <br>
                <a href="${resetURL}" style="color: #3dd5c3;">${resetURL}</a>
              </p>
            </div>
          </div>
        `
      });

      res.json({ message: 'If that email exists, a reset link has been sent' });
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Error sending email. Please try again later.' });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the token from URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    try {
      await transporter.sendMail({
        from: '"Adsteric" <adshark00@gmail.com>',
        to: user.email,
        subject: 'Password Changed Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">ADSTERIC</h1>
            </div>
            <div style="padding: 30px; background: #f5f7fa;">
              <h2 style="color: #1a202c;">Password Changed</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi ${user.fullName},
              </p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your password has been successfully changed. You can now login with your new password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
                   color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
                   display: inline-block; font-weight: 600;">
                  Login Now
                </a>
              </div>
              <p style="color: #718096; font-size: 14px;">
                If you didn't make this change, please contact our support team immediately.
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Current User (Protected Route)
// Get Current User (Protected Route)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add balance if missing
    if (user.balance === undefined || user.balance === null) {
      user.balance = 100.00;
      await user.save();
    }

    console.log('User data being sent:', { id: user._id, balance: user.balance }); // DEBUG LOG

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Create Campaign
// Replace the "Create Campaign" route in server.js (around line 420) with this updated version:

// Create Campaign
app.post('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    const { 
      campaignName, 
      targetUrl, 
      dailyBudget, 
      totalBudget, 
      campaignType, 
      targetAudience, 
      description 
    } = req.body;

    console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â Campaign creation request:', req.body);

    // Validation
    if (!campaignName || !targetUrl || !dailyBudget || !totalBudget || !campaignType || !targetAudience) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate campaign name
    if (campaignName.length < 3 || campaignName.length > 100) {
      return res.status(400).json({ message: 'Campaign name must be between 3 and 100 characters' });
    }

    // Validate URL
    const urlRegex = /^https?:\/\/.+\..+/;
    if (!urlRegex.test(targetUrl)) {
      return res.status(400).json({ message: 'Please enter a valid URL starting with http:// or https://' });
    }

    // Validate budgets
    const daily = parseFloat(dailyBudget);
    const total = parseFloat(totalBudget);

    if (isNaN(daily) || daily <= 0) {
      return res.status(400).json({ message: 'Daily budget must be greater than 0' });
    }

    if (isNaN(total) || total <= 0) {
      return res.status(400).json({ message: 'Total budget must be greater than 0' });
    }

    // Validate campaign type
    if (!['cpc', 'cpm', 'cpa'].includes(campaignType.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid campaign type' });
    }

    // Check user exists and has balance
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User balance:', user.balance, 'Required daily budget:', daily);

    // Check sufficient balance for at least one day
    if (user.balance < daily) {
      return res.status(400).json({ 
        message: `Insufficient balance. 

Funds are deducted daily.
Your campaign will run as long as you have sufficient balance.` 
      });
    }

    // No balance deduction at creation - it will be deducted daily
    console.log('Campaign approved. Balance check passed. Daily deductions will begin when campaign activates.');

    // Create campaign
    const campaign = new Campaign({
      userId: req.user.userId,
      campaignName: campaignName.trim(),
      targetUrl: targetUrl.trim(),
      dailyBudget: daily,
      totalBudget: total,
      campaignType: campaignType.toLowerCase(),
      targetAudience: targetAudience.toLowerCase(),
      description: description || `Campaign with $${daily} daily budget`,
      status: 'pending'
    });

    await campaign.save();
    console.log(' Campaign created:', campaign._id);

    // Send creation email
    try {
      await transporter.sendMail({
        from: '"Adsteric" <adshark00@gmail.com>',
        to: user.email,
        subject: 'Campaign Created Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">ADSTERIC</h1>
            </div>
            <div style="padding: 30px; background: #f5f7fa;">
              <h2 style="color: #1a202c;">Campaign Created!</h2>
              <p style="color: #4a5568;">Your campaign "${campaign.campaignName}" has been created.</p>
              <div style="background: #fef3c7; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; color: #92400e;"><strong>ÃƒÂ¢Ã‚ÂÃ‚Â±ÃƒÂ¯Ã‚Â¸Ã‚Â Auto-Activation:</strong> Your campaign will be activated in 1.5 hours.</p>
              </div>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    // Schedule auto-activation after 1.5 hours
    // Schedule auto-activation after 1.5 hours
setTimeout(async () => {
  try {
    const campaignToActivate = await Campaign.findById(campaign._id);
    if (campaignToActivate && campaignToActivate.status === 'pending') {
      campaignToActivate.status = 'active';
      campaignToActivate.startDate = new Date();
      await campaignToActivate.save();
      console.log(`Campaign ${campaign._id} auto-activated`);

      // Generate first day's statistics
      await generateAndSaveDailyStats(campaign._id);  // NEW
    }
  } catch (error) {
    console.error('Auto-activation error:', error);
  }
}, 5400000); // 1.5 hours

    res.status(201).json({
      message: 'Campaign created successfully! It will be activated in 1.5 hours.',
      campaign: {
        id: campaign._id,
        campaignName: campaign.campaignName,
        targetUrl: campaign.targetUrl,
        dailyBudget: campaign.dailyBudget,
        totalBudget: campaign.totalBudget,
        campaignType: campaign.campaignType,
        targetAudience: campaign.targetAudience,
        status: campaign.status,
        createdAt: campaign.createdAt
      }
    });

  } catch (error) {
    console.error('ÃƒÂ¢Ã‚ÂÃ…â€™ Create campaign error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get All Campaigns for User
app.get('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.userId })
      .sort('-createdAt')
      .select('-__v');

    res.json({
      campaigns,
      pagination: {
        total: campaigns.length,
        page: 1,
        pages: 1
      }
    });

  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});
// Get Single Campaign
app.get('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({ campaign });

  } catch (error) {
    console.error('Get campaign error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: 'Server error while fetching campaign' });
  }
});

// Update Campaign
app.put('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const {
      campaignName,
      targetUrl,
      dailyBudget,
      totalBudget,
      targetAudience,
      description
    } = req.body;

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Cannot edit active campaigns (only paused ones)
    if (campaign.status === 'active') {
      return res.status(400).json({ message: 'Cannot edit active campaign. Please pause it first.' });
    }

    // Validate and update fields if provided
    if (campaignName !== undefined) {
      if (campaignName.length < 3 || campaignName.length > 100) {
        return res.status(400).json({ message: 'Campaign name must be between 3 and 100 characters' });
      }
      campaign.campaignName = campaignName.trim();
    }

    if (targetUrl !== undefined) {
      const urlRegex = /^https?:\/\/.+\..+/;
      if (!urlRegex.test(targetUrl)) {
        return res.status(400).json({ message: 'Please enter a valid URL' });
      }
      campaign.targetUrl = targetUrl.trim();
    }

    if (dailyBudget !== undefined) {
      const daily = parseFloat(dailyBudget);
      if (isNaN(daily) || daily < 5) {
        return res.status(400).json({ message: 'Daily budget must be at least $5' });
      }
      campaign.dailyBudget = daily;
    }

    if (totalBudget !== undefined) {
      const total = parseFloat(totalBudget);
      if (isNaN(total) || total < 10) {
        return res.status(400).json({ message: 'Total budget must be at least $10' });
      }
      campaign.totalBudget = total;
    }

    // Validate budget relationship
    if (campaign.dailyBudget > campaign.totalBudget) {
      return res.status(400).json({ message: 'Daily budget cannot exceed total budget' });
    }

    if (targetAudience !== undefined) {
      if (!['global', 'us', 'uk', 'eu', 'asia'].includes(targetAudience.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid target audience' });
      }
      campaign.targetAudience = targetAudience.toLowerCase();
    }

    if (description !== undefined) {
      if (description.length < 10 || description.length > 1000) {
        return res.status(400).json({ message: 'Description must be between 10 and 1000 characters' });
      }
      campaign.description = description.trim();
    }

    await campaign.save();

    res.json({
      message: 'Campaign updated successfully',
      campaign
    });

  } catch (error) {
    console.error('Update campaign error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: 'Server error while updating campaign' });
  }
});
// Package Tier Ranges and Multipliers
const PACKAGE_TIERS = {
  standard: {
    range: { min: 0, max: 300 },
    multipliers: {
      impressions: { min: 1000, max: 3000 },
      ctr: { min: 1.5, max: 2.5 }, // %
      conversionRate: { min: 2.0, max: 4.0 }, // %
      approvedRate: { min: 60, max: 70 }, // %
      holdRate: { min: 15, max: 20 }, // %
      declinedRate: { min: 10, max: 20 }, // %
      payoutPerConversion: { min: 3, max: 8 }
    }
  },
  bronze: {
    range: { min: 301, max: 1000 },
    multipliers: {
      impressions: { min: 3000, max: 8000 },
      ctr: { min: 2.0, max: 3.5 },
      conversionRate: { min: 3.0, max: 5.0 },
      approvedRate: { min: 65, max: 75 },
      holdRate: { min: 12, max: 18 },
      declinedRate: { min: 7, max: 15 },
      payoutPerConversion: { min: 5, max: 10 }
    }
  },
  silver: {
    range: { min: 1001, max: 3000 },
    multipliers: {
      impressions: { min: 8000, max: 20000 },
      ctr: { min: 2.5, max: 4.0 },
      conversionRate: { min: 3.5, max: 6.0 },
      approvedRate: { min: 70, max: 80 },
      holdRate: { min: 10, max: 15 },
      declinedRate: { min: 5, max: 10 },
      payoutPerConversion: { min: 8, max: 15 }
    }
  },
  gold: {
    range: { min: 3001, max: 8000 },
    multipliers: {
      impressions: { min: 20000, max: 50000 },
      ctr: { min: 3.0, max: 5.0 },
      conversionRate: { min: 4.0, max: 7.0 },
      approvedRate: { min: 75, max: 85 },
      holdRate: { min: 8, max: 12 },
      declinedRate: { min: 3, max: 8 },
      payoutPerConversion: { min: 12, max: 20 }
    }
  },
  platinum: {
    range: { min: 8001, max: 25000 },
    multipliers: {
      impressions: { min: 50000, max: 150000 },
      ctr: { min: 3.5, max: 6.0 },
      conversionRate: { min: 5.0, max: 8.5 },
      approvedRate: { min: 80, max: 90 },
      holdRate: { min: 5, max: 10 },
      declinedRate: { min: 2, max: 5 },
      payoutPerConversion: { min: 18, max: 30 }
    }
  },
  diamond: {
    range: { min: 25001, max: Infinity },
    multipliers: {
      impressions: { min: 150000, max: 500000 },
      ctr: { min: 4.0, max: 7.5 },
      conversionRate: { min: 6.0, max: 10.0 },
      approvedRate: { min: 85, max: 95 },
      holdRate: { min: 3, max: 7 },
      declinedRate: { min: 1, max: 3 },
      payoutPerConversion: { min: 25, max: 50 }
    }
  }
};

// Calculate user's package tier based on total spent
function calculatePackageTier(totalSpent) {
  if (totalSpent >= PACKAGE_TIERS.diamond.range.min) return 'diamond';
  if (totalSpent >= PACKAGE_TIERS.platinum.range.min) return 'platinum';
  if (totalSpent >= PACKAGE_TIERS.gold.range.min) return 'gold';
  if (totalSpent >= PACKAGE_TIERS.silver.range.min) return 'silver';
  if (totalSpent >= PACKAGE_TIERS.bronze.range.min) return 'bronze';
  return 'standard';
}

// Generate random number within range
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate daily statistics for a campaign
function generateDailyStats(dailyBudget, packageTier, campaignType) {
  const tier = PACKAGE_TIERS[packageTier];
  const multipliers = tier.multipliers;

  // Base impressions from tier range
  const impressions = Math.floor(randomInRange(
    multipliers.impressions.min,
    multipliers.impressions.max
  ));

  // CTR (Click-Through Rate)
  const ctr = randomInRange(multipliers.ctr.min, multipliers.ctr.max);
  const clicks = Math.floor(impressions * (ctr / 100));

  // Conversion Rate
  const conversionRate = randomInRange(
    multipliers.conversionRate.min,
    multipliers.conversionRate.max
  );
  const totalConversions = Math.floor(clicks * (conversionRate / 100));

  // Split conversions by status
  const approvedRate = randomInRange(multipliers.approvedRate.min, multipliers.approvedRate.max);
  const holdRate = randomInRange(multipliers.holdRate.min, multipliers.holdRate.max);
  const declinedRate = 100 - approvedRate - holdRate;

  const approvedConversions = Math.floor(totalConversions * (approvedRate / 100));
  const holdConversions = Math.floor(totalConversions * (holdRate / 100));
  const declinedConversions = totalConversions - approvedConversions - holdConversions;

  // Calculate payouts
  const payoutPerConversion = randomInRange(
    multipliers.payoutPerConversion.min,
    multipliers.payoutPerConversion.max
  );

  const approvedPayout = approvedConversions * payoutPerConversion;
  const holdPayout = holdConversions * payoutPerConversion * 0.8; // Hold gets 80%
  const declinedPayout = declinedConversions * payoutPerConversion * 0.3; // Declined gets 30%

  // Calculate EPC (Earnings Per Click)
  const totalPayout = approvedPayout + holdPayout + declinedPayout;
  const epc = clicks > 0 ? totalPayout / clicks : 0;

  return {
    impressions,
    clicks,
    conversions: {
      approved: approvedConversions,
      hold: holdConversions,
      declined: declinedConversions,
      total: totalConversions
    },
    spent: Math.min(dailyBudget, dailyBudget * randomInRange(0.85, 1.0)), // 85-100% of budget
    payouts: {
      approved: parseFloat(approvedPayout.toFixed(2)),
      hold: parseFloat(holdPayout.toFixed(2)),
      declined: parseFloat(declinedPayout.toFixed(2)),
      total: parseFloat(totalPayout.toFixed(2))
    },
    ctr: parseFloat(ctr.toFixed(3)),
    conversionRate: parseFloat(conversionRate.toFixed(3)),
    epc: parseFloat(epc.toFixed(3))
  };
}
// Update Campaign Status (Pause/Resume/Delete)
app.patch('/api/campaigns/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use: active, paused, or completed' });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Business logic checks
    if (status === 'active' && campaign.status === 'rejected') {
      return res.status(400).json({ message: 'Cannot activate rejected campaign' });
    }

    if (status === 'active' && campaign.status === 'completed') {
      return res.status(400).json({ message: 'Cannot reactivate completed campaign' });
    }

    const oldStatus = campaign.status;
    campaign.status = status;

    // Set start date when activating for the first time
    if (status === 'active' && !campaign.startDate) {
      campaign.startDate = new Date();
    }

    // Set end date when completing
    if (status === 'completed' && !campaign.endDate) {
      campaign.endDate = new Date();
    }

    await campaign.save();

    // Send email notification for status changes
    try {
      const user = await User.findById(req.user.userId);
      const statusMessages = {
        active: 'activated',
        paused: 'paused',
        completed: 'completed'
      };

      await transporter.sendMail({
        from: '"Adsteric" <adshark00@gmail.com>',
        to: user.email,
        subject: `Campaign ${statusMessages[status].charAt(0).toUpperCase() + statusMessages[status].slice(1)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">ADSTERIC</h1>
            </div>
            <div style="padding: 30px; background: #f5f7fa;">
              <h2 style="color: #1a202c;">Campaign Status Updated</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your campaign "<strong>${campaign.campaignName}</strong>" has been ${statusMessages[status]}.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/dashboard2.html" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
                   color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
                   display: inline-block; font-weight: 600;">
                  View Campaign
                </a>
              </div>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
    }

    res.json({
      message: `Campaign ${status === 'active' ? 'activated' : status === 'paused' ? 'paused' : 'completed'} successfully`,
      campaign
    });

  } catch (error) {
    console.error('Update campaign status error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: 'Server error while updating campaign status' });
  }
});

// Delete Campaign
app.delete('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Cannot delete active campaigns
    if (campaign.status === 'active') {
      return res.status(400).json({ 
        message: 'Cannot delete active campaign. Please pause it first.' 
      });
    }

    await Campaign.deleteOne({ _id: req.params.id });

    res.json({ message: 'Campaign deleted successfully' });

  } catch (error) {
    console.error('Delete campaign error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: 'Server error while deleting campaign' });
  }
});
app.patch('/api/campaigns/:id/pause', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ message: 'Only active campaigns can be paused' });
    }

    campaign.status = 'paused';
    await campaign.save();

    res.json({
      message: 'Campaign paused successfully',
      campaign
    });

  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({ message: 'Server error while pausing campaign' });
  }
});

app.patch('/api/campaigns/:id/resume', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'paused') {
      return res.status(400).json({ message: 'Only paused campaigns can be resumed' });
    }

    campaign.status = 'active';
    await campaign.save();

    res.json({
      message: 'Campaign resumed successfully',
      campaign
    });

  } catch (error) {
    console.error('Resume campaign error:', error);
    res.status(500).json({ message: 'Server error while resuming campaign' });
  }
});
async function checkPendingCampaigns() {
  try {
    const pendingCampaigns = await Campaign.find({ status: 'pending' });
    console.log(`Found ${pendingCampaigns.length} pending campaigns`);
    
    for (const campaign of pendingCampaigns) {
      const createdTime = new Date(campaign.createdAt).getTime();
      const currentTime = Date.now();
      const timeDiff = currentTime - createdTime;
      const activationTime = 5400000; // 1.5 hours

      if (timeDiff >= activationTime) {
        campaign.status = 'active';
        campaign.startDate = new Date();
        await campaign.save();
        console.log(`Campaign ${campaign._id} activated on startup`);
      } else {
        const remainingTime = activationTime - timeDiff;
        setTimeout(async () => {
          try {
            const c = await Campaign.findById(campaign._id);
            if (c && c.status === 'pending') {
              c.status = 'active';
              c.startDate = new Date();
              await c.save();
              console.log(`Campaign ${campaign._id} auto-activated`);
            }
          } catch (error) {
            console.error('Error:', error);
          }
        }, remainingTime);
        console.log(`Scheduled campaign ${campaign._id} for activation in ${(remainingTime/60000).toFixed(1)} minutes`);
      }
    }
  } catch (error) {
    console.error('Error checking pending campaigns:', error);
  }
}

// Get Campaign Statistics Summary
app.get('/api/campaigns/stats/summary', authenticateToken, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.userId });

    const summary = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      pausedCampaigns: campaigns.filter(c => c.status === 'paused').length,
      completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
      totalSpent: campaigns.reduce((sum, c) => sum + c.statistics.spent, 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.statistics.revenue, 0),
      totalImpressions: campaigns.reduce((sum, c) => sum + c.statistics.impressions, 0),
      totalClicks: campaigns.reduce((sum, c) => sum + c.statistics.clicks, 0),
      totalConversions: campaigns.reduce((sum, c) => sum + c.statistics.conversions, 0)
    };

    // Calculate averages
    summary.averageCTR = summary.totalImpressions > 0
      ? ((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2)
      : 0;

    summary.averageConversionRate = summary.totalClicks > 0
      ? ((summary.totalConversions / summary.totalClicks) * 100).toFixed(2)
      : 0;

    summary.roi = summary.totalSpent > 0
      ? (((summary.totalRevenue - summary.totalSpent) / summary.totalSpent) * 100).toFixed(2)
      : 0;

    res.json({ summary });

  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});
// Function to generate and save daily statistics
async function generateAndSaveDailyStats(campaignId) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'active') {
      return;
    }

    const user = await User.findById(campaign.userId);
    if (!user) {
      return;
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if campaign was activated today or before today
    // Only generate stats if campaign's startDate is today or earlier
    if (campaign.startDate) {
      const campaignStartDate = new Date(campaign.startDate);
      campaignStartDate.setHours(0, 0, 0, 0);
      
      // If campaign was activated after today, don't generate stats
      if (campaignStartDate > today) {
        console.log(`Campaign ${campaignId} not yet started. Start date: ${campaignStartDate}, Today: ${today}`);
        return;
      }
    }

    // Check if stats already exist for today
    const existingStats = await DailyStatistics.findOne({
      userId: user._id,
      campaignId: campaign._id,
      date: today
    });

    if (existingStats) {
      console.log(`Stats already exist for campaign ${campaignId} on ${today}`);
      return;
    }

    // Generate stats based on user's package tier
    const stats = generateDailyStats(
      campaign.dailyBudget,
      user.currentPackage,
      campaign.campaignType
    );

    // Save daily statistics
    const dailyStats = new DailyStatistics({
      userId: user._id,
      campaignId: campaign._id,
      date: today,
      ...stats
    });

    await dailyStats.save();

    // Update campaign cumulative statistics
    campaign.statistics.impressions += stats.impressions;
    campaign.statistics.clicks += stats.clicks;
    campaign.statistics.conversions += stats.conversions.total;
    campaign.statistics.spent += stats.spent;
    await campaign.save();

    console.log(`Ã¢Å“â€¦ Generated daily stats for campaign ${campaignId}:`, {
      package: user.currentPackage,
      impressions: stats.impressions,
      clicks: stats.clicks,
      conversions: stats.conversions.total,
      spent: stats.spent
    });

  } catch (error) {
    console.error('Error generating daily stats:', error);
  }
}

// Get Statistics for User
// Get Statistics for User
app.get('/api/statistics', authenticateToken, async (req, res) => {
  try {
    console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â  Statistics request from user:', req.user.userId);
    
    const { startDate, endDate, campaignId, groupBy = 'date' } = req.query;

    // Build query
    const query = { userId: req.user.userId };

    if (campaignId) {
      query.campaignId = campaignId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    } else {
      // Default: last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo };
    }

    console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â  Query:', JSON.stringify(query));

    // Fetch statistics
    const statistics = await DailyStatistics.find(query)
      .populate('campaignId', 'campaignName')
      .sort({ date: -1 });

    console.log(`ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â  Found ${statistics.length} statistics records`);

    // Get user info for package display
    const user = await User.findById(req.user.userId).select('currentPackage totalSpent');

    console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â  User package:', user.currentPackage, 'Total spent:', user.totalSpent);

    // Calculate totals
    const totals = statistics.reduce((acc, stat) => {
      acc.clicks += stat.clicks;
      acc.impressions += stat.impressions;
      acc.conversions.approved += stat.conversions.approved;
      acc.conversions.hold += stat.conversions.hold;
      acc.conversions.declined += stat.conversions.declined;
      acc.conversions.total += stat.conversions.total;
      acc.spent += stat.spent;
      acc.payouts.approved += stat.payouts.approved;
      acc.payouts.hold += stat.payouts.hold;
      acc.payouts.declined += stat.payouts.declined;
      acc.payouts.total += stat.payouts.total;
      return acc;
    }, {
      clicks: 0,
      impressions: 0,
      conversions: { approved: 0, hold: 0, declined: 0, total: 0 },
      spent: 0,
      payouts: { approved: 0, hold: 0, declined: 0, total: 0 }
    });

    // Calculate averages
    const avgCTR = totals.impressions > 0 
      ? ((totals.clicks / totals.impressions) * 100).toFixed(3)
      : '0.000';
    
    const avgEPC = totals.clicks > 0
      ? (totals.payouts.total / totals.clicks).toFixed(3)
      : '0.000';

    const response = {
      statistics: statistics.map(stat => ({
        date: stat.date,
        campaignName: stat.campaignId?.campaignName || 'Unknown Campaign',
        clicks: stat.clicks,
        impressions: stat.impressions,
        conversions: stat.conversions,
        payouts: stat.payouts,
        ctr: stat.ctr,
        conversionRate: stat.conversionRate,
        epc: stat.epc,
        spent: stat.spent
      })),
      totals: {
        ...totals,
        avgCTR: parseFloat(avgCTR),
        avgEPC: parseFloat(avgEPC)
      },
      userPackage: {
        current: user.currentPackage,
        totalSpent: user.totalSpent,
        nextTier: getNextTierInfo(user.totalSpent)
      }
    };

    console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â  Sending response with', statistics.length, 'records');
    res.json(response);

  } catch (error) {
    console.error('ÃƒÂ¢Ã‚ÂÃ…â€™ Get statistics error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});
// Helper function to get next tier info
function getNextTierInfo(totalSpent) {
  const tiers = ['standard', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentTier = calculatePackageTier(totalSpent);
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentIndex === tiers.length - 1) {
    return { 
      tier: null, 
      amountNeeded: 0, 
      message: 'Maximum tier reached!' 
    };
  }
  
  const nextTier = tiers[currentIndex + 1];
  const nextTierMin = PACKAGE_TIERS[nextTier].range.min;
  const amountNeeded = nextTierMin - totalSpent;
  
  return {
    tier: nextTier,
    amountNeeded: Math.max(0, amountNeeded),
    message: amountNeeded > 0 
      ? `Spend $${amountNeeded.toFixed(2)} more to reach ${nextTier.toUpperCase()} tier`
      : `You've reached ${nextTier.toUpperCase()} tier!`
  };
}
// Schedule daily stats generation for all active campaigns
async function generateDailyStatsForAllCampaigns() {
  try {
    const activeCampaigns = await Campaign.find({ status: 'active' });
    console.log(`Generating daily stats for ${activeCampaigns.length} active campaigns...`);

    for (const campaign of activeCampaigns) {
      await generateAndSaveDailyStats(campaign._id);
    }

    console.log('Daily stats generation completed');
  } catch (error) {
    console.error('Error in daily stats generation:', error);
  }
}


// Deduct daily budget from all active campaigns
async function deductDailyBudgets() {
  try {
    const activeCampaigns = await Campaign.find({ status: 'active' });
    console.log(`Processing daily budget deductions for ${activeCampaigns.length} active campaigns...`);

    for (const campaign of activeCampaigns) {
      try {
        const user = await User.findById(campaign.userId);
        if (!user) {
          console.log(`User not found for campaign ${campaign._id}`);
          continue;
        }

        // Check if campaign has already reached total budget
        const currentSpent = campaign.statistics?.spent || 0;
        if (currentSpent >= campaign.totalBudget) {
          campaign.status = 'completed';
          await campaign.save();
          console.log(`Campaign ${campaign.campaignName} already completed - total budget reached`);
          continue;
        }

        // Check if user has sufficient balance for daily budget
        if (user.balance >= campaign.dailyBudget) {
          // Deduct daily budget
          user.balance -= campaign.dailyBudget;
          user.totalSpent = (user.totalSpent || 0) + campaign.dailyBudget;
          user.currentPackage = calculatePackageTier(user.totalSpent);
          await user.save();

          // Track actual spending on campaign
          campaign.statistics = campaign.statistics || {};
          campaign.statistics.spent = (campaign.statistics.spent || 0) + campaign.dailyBudget;
          
          console.log(`Deducted $${campaign.dailyBudget} from user ${user.email} for campaign ${campaign.campaignName}. Campaign spent: $${campaign.statistics.spent}/${campaign.totalBudget}`);

          // Check if total budget reached after this deduction
          if (campaign.statistics.spent >= campaign.totalBudget) {
            campaign.status = 'completed';
            await campaign.save();
            console.log(`Campaign ${campaign.campaignName} completed - total budget of $${campaign.totalBudget} reached`);
          } else {
            await campaign.save();
          }
        } else {
          // Insufficient balance - pause campaign
          campaign.status = 'paused';
          await campaign.save();
          console.log(`Campaign ${campaign.campaignName} paused - insufficient balance. Required: $${campaign.dailyBudget}, Available: $${user.balance}`);

          // Send email notification
          try {
            await transporter.sendMail({
              from: '"Adsteric" <adshark00@gmail.com>',
              to: user.email,
              subject: 'Campaign Paused - Insufficient Balance',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">ADSTERIC</h1>
                  </div>
                  <div style="padding: 30px; background: #f5f7fa;">
                    <h2 style="color: #1a202c;">Campaign Paused</h2>
                    <p style="color: #4a5568;">Your campaign "${campaign.campaignName}" has been paused due to insufficient balance.</p>
                    <div style="background: #fee2e2; padding: 16px; margin: 20px 0; border-radius: 8px;">
                      <p style="margin: 0; color: #991b1b;"><strong>Required:</strong> $${campaign.dailyBudget} daily budget</p>
                      <p style="margin: 5px 0 0 0; color: #991b1b;"><strong>Available:</strong> $${user.balance.toFixed(2)}</p>
                    </div>
                    <p style="color: #4a5568;">Please add funds to your account to resume this campaign.</p>
                  </div>
                </div>
              `
            });
          } catch (emailError) {
            console.error('Error sending insufficient balance email:', emailError);
          }
        }
      } catch (campaignError) {
        console.error(`Error processing campaign ${campaign._id}:`, campaignError);
      }
    }

    console.log('Daily budget deductions completed');
  } catch (error) {
    console.error('Error in daily budget deduction:', error);
  }
}

// Run daily stats generation every 24 hours (at midnight)
function scheduleDailyStatsGeneration() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeUntilMidnight = tomorrow - now;

  // First run at midnight
  setTimeout(() => {
    // Run both daily budget deductions and stats generation
    deductDailyBudgets();
    generateDailyStatsForAllCampaigns();
    
    // Then run every 24 hours
    setInterval(() => {
      deductDailyBudgets();
      generateDailyStatsForAllCampaigns();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);

  console.log(`Daily tasks (budget deductions & stats) will run in ${(timeUntilMidnight / 1000 / 60).toFixed(0)} minutes`);
}
app.post('/api/admin/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin signin error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Admin Forgot Password
app.post('/api/admin/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    admin.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    admin.resetPasswordExpires = Date.now() + 3600000;

    await admin.save();

    const resetURL = `${FRONTEND_URL}/admin-reset-password.html?token=${resetToken}`;

    await transporter.sendMail({
      from: '"Adsteric Admin" <adshark00@gmail.com>',
      to: email,
      subject: 'Admin Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">ADSTERIC ADMIN</h1>
          </div>
          <div style="padding: 30px; background: #f5f7fa;">
            <h2 style="color: #1a202c;">Admin Password Reset</h2>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
                 color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
                 display: inline-block; font-weight: 600;">Reset Password</a>
            </div>
            <p style="color: #718096; font-size: 14px;">This link expires in 1 hour.</p>
          </div>
        </div>
      `
    });

    res.json({ message: 'If that email exists, a reset link has been sent' });

  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Create Payment Request (User submits payment)
app.post('/api/payment', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod, cardNumber, expiryDate, cvc, paypalEmail } = req.body;

    console.log('Payment request received:', { amount, paymentMethod, userId: req.user.userId });

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Validate payment method
    if (!['stripe', 'paypal'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Check if user already has a pending payment
    const existingPending = await PaymentRequest.findOne({
      userId: req.user.userId,
      status: 'pending'
    });

    if (existingPending) {
      return res.status(400).json({ 
        error: 'You already have a pending payment request. Please wait for admin approval.' 
      });
    }

    // Store payment details (mask sensitive data)
    const paymentDetails = {};
    if (paymentMethod === 'stripe') {
      paymentDetails.cardNumber = cardNumber ? `****${cardNumber.slice(-4)}` : '****';
      paymentDetails.expiryDate = expiryDate || '';
    } else {
      paymentDetails.paypalEmail = paypalEmail || '';
    }

    // Create payment request
    const paymentRequest = new PaymentRequest({
      userId: req.user.userId,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDetails,
      status: 'pending'
    });

    await paymentRequest.save();
    console.log('Payment request created:', paymentRequest._id);

    res.json({
      success: true,
      paymentId: paymentRequest._id,
      message: 'Your payment is under review. Please wait for admin approval.'
    });

  } catch (error) {
    console.error('Payment request error:', error);
    res.status(500).json({ error: 'Failed to submit payment request' });
  }
});

// Get User's Payment Request Status
app.get('/api/payment/status', authenticateToken, async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findOne({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    if (!paymentRequest) {
      return res.status(404).json({ message: 'No payment found' });
    }

    res.json({
      status: paymentRequest.status,
      amount: paymentRequest.amount,
      paymentId: paymentRequest._id,
      createdAt: paymentRequest.createdAt,
      rejectionReason: paymentRequest.rejectionReason
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Check specific payment status by ID
app.get('/api/payment/:paymentId/status', authenticateToken, async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findById(req.params.paymentId);

    if (!paymentRequest) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    // Verify the payment belongs to the user
    if (paymentRequest.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      status: paymentRequest.status,
      amount: paymentRequest.amount,
      rejectionReason: paymentRequest.rejectionReason
    });

  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// ========== ADMIN PAYMENT ROUTES ==========

// Get all payment requests (Admin only)
app.get('/api/admin/payment-requests', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = status ? { status } : {};
    
    const paymentRequests = await PaymentRequest.find(filter)
      .populate('userId', 'fullName email balance')
      .sort({ createdAt: -1 });

    console.log(`Found ${paymentRequests.length} payment requests`);
    res.json({ paymentRequests });

  } catch (error) {
    console.error('Get payment requests error:', error);
    res.status(500).json({ message: 'Failed to fetch payment requests' });
  }
});

// Approve Payment Request (Admin only)
app.patch('/api/admin/payment-requests/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    console.log('Approving payment request:', req.params.id);
    console.log('Admin ID:', req.admin.adminId);

    const paymentRequest = await PaymentRequest.findById(req.params.id)
      .populate('userId');

    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    if (paymentRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Payment request already processed' });
    }

    // Update user balance
    const user = await User.findById(paymentRequest.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Current user balance:', user.balance);
    console.log('Adding amount:', paymentRequest.amount);

    user.balance += paymentRequest.amount;
    await user.save();

    console.log('New user balance:', user.balance);

    // Update payment request status
    paymentRequest.status = 'approved';
    paymentRequest.processedBy = req.admin.adminId;
    paymentRequest.processedAt = new Date();
    await paymentRequest.save();

    console.log('Payment request approved successfully');

    res.json({
      message: 'Payment approved successfully',
      newBalance: user.balance
    });

  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ message: error.message || 'Failed to approve payment' });
  }
});

// Reject Payment Request (Admin only)
app.patch('/api/admin/payment-requests/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    console.log('Rejecting payment request:', req.params.id);
    const { reason } = req.body;

    const paymentRequest = await PaymentRequest.findById(req.params.id);

    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    if (paymentRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Payment request already processed' });
    }

    // Update payment request status
    paymentRequest.status = 'rejected';
    paymentRequest.rejectionReason = reason || 'Payment verification failed';
    paymentRequest.processedBy = req.admin.adminId;
    paymentRequest.processedAt = new Date();
    await paymentRequest.save();

    console.log('Payment request rejected successfully');

    res.json({
      message: 'Payment rejected successfully'
    });

  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ message: error.message || 'Failed to reject payment' });
  }
});
// Admin Reset Password
app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    admin.password = password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Users (Admin)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const query = search ? {
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Balance (Admin)
app.patch('/api/admin/users/:id/balance', authenticateAdmin, async (req, res) => {
  try {
    const { amount, action } = req.body; // action: 'add' or 'set'

    if (!amount || amount < 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'add') {
      user.balance += parseFloat(amount);
    } else {
      user.balance = parseFloat(amount);
    }

    await user.save();

    res.json({
      message: 'Balance updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Campaigns (Admin)
app.get('/api/admin/campaigns', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search = '' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) query.campaignName = { $regex: search, $options: 'i' };

    const campaigns = await Campaign.find(query)
      .populate('userId', 'fullName email')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get admin campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.post('/api/admin/generate-missing-stats', authenticateToken, async (req, res) => {
  try {
    // Get all active campaigns for the user
    const activeCampaigns = await Campaign.find({ 
      userId: req.user.userId,
      status: 'active' 
    });

    console.log(`Found ${activeCampaigns.length} active campaigns for user ${req.user.userId}`);

    const results = [];
    
    for (const campaign of activeCampaigns) {
      // Check if stats exist for this campaign
      const existingStats = await DailyStatistics.findOne({
        campaignId: campaign._id,
        userId: req.user.userId
      });

      if (!existingStats) {
        // Generate stats for this campaign
        await generateAndSaveDailyStats(campaign._id);
        results.push({
          campaignId: campaign._id,
          campaignName: campaign.campaignName,
          status: 'Generated'
        });
      } else {
        results.push({
          campaignId: campaign._id,
          campaignName: campaign.campaignName,
          status: 'Already exists'
        });
      }
    }

    res.json({
      message: 'Stats generation completed',
      activeCampaigns: activeCampaigns.length,
      results
    });

  } catch (error) {
    console.error('Generate missing stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Update Campaign Status (Admin)
// Clean up and correct existing stats (remove duplicates and invalid date stats)
app.post('/api/admin/cleanup-stats', authenticateAdmin, async (req, res) => {
  try {
    console.log('Ã°Å¸Â§Â¹ Starting stats cleanup...');
    
    const report = {
      duplicatesRemoved: 0,
      invalidDateStatsRemoved: 0,
      campaignsProcessed: 0,
      errors: []
    };

    // Get all campaigns
    const allCampaigns = await Campaign.find({});
    console.log(`Found ${allCampaigns.length} campaigns to process`);

    for (const campaign of allCampaigns) {
      try {
        report.campaignsProcessed++;

        // 1. Remove duplicate stats (keep only the first one for each date)
        const stats = await DailyStatistics.find({
          campaignId: campaign._id
        }).sort({ date: 1, createdAt: 1 });

        // Group by date
        const statsByDate = {};
        for (const stat of stats) {
          const dateKey = stat.date.toISOString().split('T')[0];
          if (!statsByDate[dateKey]) {
            statsByDate[dateKey] = [];
          }
          statsByDate[dateKey].push(stat);
        }

        // Remove duplicates (keep first, delete rest)
        for (const dateKey in statsByDate) {
          const dateStats = statsByDate[dateKey];
          if (dateStats.length > 1) {
            console.log(`Found ${dateStats.length} duplicate stats for campaign ${campaign.campaignName} on ${dateKey}`);
            // Keep the first one, delete the rest
            for (let i = 1; i < dateStats.length; i++) {
              await DailyStatistics.findByIdAndDelete(dateStats[i]._id);
              report.duplicatesRemoved++;
            }
          }
        }

        // 2. Remove stats that were created before campaign activation date
        if (campaign.startDate) {
          const campaignStartDate = new Date(campaign.startDate);
          campaignStartDate.setHours(0, 0, 0, 0);

          const invalidStats = await DailyStatistics.find({
            campaignId: campaign._id,
            date: { $lt: campaignStartDate }
          });

          if (invalidStats.length > 0) {
            console.log(`Found ${invalidStats.length} invalid date stats for campaign ${campaign.campaignName}`);
            for (const stat of invalidStats) {
              await DailyStatistics.findByIdAndDelete(stat._id);
              report.invalidDateStatsRemoved++;
            }
          }
        }

      } catch (error) {
        console.error(`Error processing campaign ${campaign._id}:`, error);
        report.errors.push({
          campaignId: campaign._id,
          campaignName: campaign.campaignName,
          error: error.message
        });
      }
    }

    console.log('Ã¢Å“â€¦ Stats cleanup completed:', report);

    res.json({
      message: 'Stats cleanup completed successfully',
      report
    });

  } catch (error) {
    console.error('Stats cleanup error:', error);
    res.status(500).json({ message: 'Server error during cleanup', error: error.message });
  }
});

// Clean up stats for a specific user
app.post('/api/cleanup-my-stats', authenticateToken, async (req, res) => {
  try {
    console.log(`Ã°Å¸Â§Â¹ Starting stats cleanup for user ${req.user.userId}...`);
    
    const report = {
      duplicatesRemoved: 0,
      invalidDateStatsRemoved: 0,
      campaignsProcessed: 0,
      errors: []
    };

    // Get all campaigns for this user
    const userCampaigns = await Campaign.find({ userId: req.user.userId });
    console.log(`Found ${userCampaigns.length} campaigns for user`);

    for (const campaign of userCampaigns) {
      try {
        report.campaignsProcessed++;

        // 1. Remove duplicate stats (keep only the first one for each date)
        const stats = await DailyStatistics.find({
          campaignId: campaign._id,
          userId: req.user.userId
        }).sort({ date: 1, createdAt: 1 });

        // Group by date
        const statsByDate = {};
        for (const stat of stats) {
          const dateKey = stat.date.toISOString().split('T')[0];
          if (!statsByDate[dateKey]) {
            statsByDate[dateKey] = [];
          }
          statsByDate[dateKey].push(stat);
        }

        // Remove duplicates (keep first, delete rest)
        for (const dateKey in statsByDate) {
          const dateStats = statsByDate[dateKey];
          if (dateStats.length > 1) {
            console.log(`Found ${dateStats.length} duplicate stats for campaign ${campaign.campaignName} on ${dateKey}`);
            // Keep the first one, delete the rest
            for (let i = 1; i < dateStats.length; i++) {
              await DailyStatistics.findByIdAndDelete(dateStats[i]._id);
              report.duplicatesRemoved++;
            }
          }
        }

        // 2. Remove stats that were created before campaign activation date
        if (campaign.startDate) {
          const campaignStartDate = new Date(campaign.startDate);
          campaignStartDate.setHours(0, 0, 0, 0);

          const invalidStats = await DailyStatistics.find({
            campaignId: campaign._id,
            userId: req.user.userId,
            date: { $lt: campaignStartDate }
          });

          if (invalidStats.length > 0) {
            console.log(`Found ${invalidStats.length} invalid date stats for campaign ${campaign.campaignName}`);
            for (const stat of invalidStats) {
              await DailyStatistics.findByIdAndDelete(stat._id);
              report.invalidDateStatsRemoved++;
            }
          }
        }

      } catch (error) {
        console.error(`Error processing campaign ${campaign._id}:`, error);
        report.errors.push({
          campaignId: campaign._id,
          campaignName: campaign.campaignName,
          error: error.message
        });
      }
    }

    console.log('Ã¢Å“â€¦ Stats cleanup completed for user:', report);

    res.json({
      message: 'Your stats have been cleaned up successfully',
      report
    });

  } catch (error) {
    console.error('Stats cleanup error:', error);
    res.status(500).json({ message: 'Server error during cleanup', error: error.message });
  }
});


app.patch('/api/admin/campaigns/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'active', 'paused', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const campaign = await Campaign.findById(req.params.id).populate('userId', 'email fullName');
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.status = status;

    if (status === 'active' && !campaign.startDate) {
      campaign.startDate = new Date();
    }

    if (status === 'completed' && !campaign.endDate) {
      campaign.endDate = new Date();
    }

    await campaign.save();

    // Send email notification
    try {
      await transporter.sendMail({
        from: '"Adsteric" <adshark00@gmail.com>',
        to: campaign.userId.email,
        subject: `Campaign ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">ADSTERIC</h1>
            </div>
            <div style="padding: 30px; background: #f5f7fa;">
              <h2 style="color: #1a202c;">Campaign Status Updated</h2>
              <p>Your campaign "${campaign.campaignName}" has been ${status}.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/dashboard2.html" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
                   color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
                   display: inline-block; font-weight: 600;">View Dashboard</a>
              </div>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
    }

    res.json({
      message: 'Campaign status updated successfully',
      campaign
    });

  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Dashboard Stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });

    const campaigns = await Campaign.find();
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.statistics.spent, 0);

    res.json({
      stats: {
        totalUsers,
        totalCampaigns,
        activeCampaigns,
        pendingCampaigns,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});