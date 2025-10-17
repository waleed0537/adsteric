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
  balance: {              // ← MAKE SURE THIS IS HERE
    type: Number,
    default: 100.00,
    min: 0
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Campaign Schema
const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  campaignName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  targetUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  dailyBudget: {
    type: Number,
    required: true,
    min: 5,
    max: 100000
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 10,
    max: 1000000
  },
  campaignType: {
    type: String,
    required: true,
    enum: ['cpc', 'cpm', 'cpa'],
    lowercase: true
  },
  targetAudience: {
    type: String,
    required: true,
    enum: ['global', 'us', 'uk', 'eu', 'asia'],
    lowercase: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'completed', 'rejected'],
    default: 'pending'
  },
  statistics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate budget constraints
campaignSchema.pre('save', function(next) {
  if (this.dailyBudget > this.totalBudget) {
    next(new Error('Daily budget cannot exceed total budget'));
  }
  next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);


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

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
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
transporter.verify(function(error, success) {
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
      balance: 100.00  // ← ADD THIS LINE
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
                balance: user.balance  // ← ADD THIS LINE

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

    // Validation
    if (!campaignName || !targetUrl || !dailyBudget || !totalBudget || !campaignType || !targetAudience || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate campaign name length
    if (campaignName.length < 3 || campaignName.length > 100) {
      return res.status(400).json({ message: 'Campaign name must be between 3 and 100 characters' });
    }

    // Validate URL format
    const urlRegex = /^https?:\/\/.+\..+/;
    if (!urlRegex.test(targetUrl)) {
      return res.status(400).json({ message: 'Please enter a valid URL (must start with http:// or https://)' });
    }

    // Validate budgets
    const daily = parseFloat(dailyBudget);
    const total = parseFloat(totalBudget);

    if (isNaN(daily) || daily < 5) {
      return res.status(400).json({ message: 'Daily budget must be at least $5' });
    }

    if (isNaN(total) || total < 10) {
      return res.status(400).json({ message: 'Total budget must be at least $10' });
    }

    if (daily > total) {
      return res.status(400).json({ message: 'Daily budget cannot exceed total budget' });
    }

    // Validate campaign type
    if (!['cpc', 'cpm', 'cpa'].includes(campaignType.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid campaign type' });
    }

    // Validate target audience
    if (!['global', 'us', 'uk', 'eu', 'asia'].includes(targetAudience.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid target audience' });
    }

    // Validate description length
    if (description.length < 10 || description.length > 1000) {
      return res.status(400).json({ message: 'Description must be between 10 and 1000 characters' });
    }

    // Check user's account balance (assuming you have a balance field in User model)
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optional: Check if user has sufficient balance
    if (user.balance < total) {
      return res.status(400).json({ message: 'Insufficient balance. Please add funds to your account.' });
    }

    // Create campaign
    const campaign = new Campaign({
      userId: req.user.userId,
      campaignName: campaignName.trim(),
      targetUrl: targetUrl.trim(),
      dailyBudget: daily,
      totalBudget: total,
      campaignType: campaignType.toLowerCase(),
      targetAudience: targetAudience.toLowerCase(),
      description: description.trim(),
      status: 'pending' // Campaigns start as pending for review
    });

    await campaign.save();

    // Send email notification
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
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi ${user.fullName},
              </p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your campaign "<strong>${campaign.campaignName}</strong>" has been created successfully and is currently under review.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1a202c; margin-top: 0;">Campaign Details:</h3>
                <p style="margin: 8px 0; color: #4a5568;"><strong>Type:</strong> ${campaign.campaignType.toUpperCase()}</p>
                <p style="margin: 8px 0; color: #4a5568;"><strong>Daily Budget:</strong> $${campaign.dailyBudget.toFixed(2)}</p>
                <p style="margin: 8px 0; color: #4a5568;"><strong>Total Budget:</strong> $${campaign.totalBudget.toFixed(2)}</p>
                <p style="margin: 8px 0; color: #4a5568;"><strong>Target:</strong> ${campaign.targetAudience.toUpperCase()}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/dashboard.html" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
                   color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; 
                   display: inline-block; font-weight: 600;">
                  View Campaign
                </a>
              </div>
              <p style="color: #718096; font-size: 14px;">
                Your campaign will be reviewed and activated within 24 hours.
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending campaign creation email:', emailError);
    }

    res.status(201).json({
      message: 'Campaign created successfully',
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
    console.error('Create campaign error:', error);
    if (error.message === 'Daily budget cannot exceed total budget') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating campaign' });
  }
});

// Get All Campaigns for User
app.get('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    const { status, sort = '-createdAt', limit = 50, page = 1 } = req.query;

    const query = { userId: req.user.userId };
    
    // Filter by status if provided
    if (status && ['pending', 'active', 'paused', 'completed', 'rejected'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await Campaign.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');

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
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error while fetching campaigns' });
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
                <a href="${FRONTEND_URL}/dashboard.html" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
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
      return res.status(400).json({ message: 'Cannot delete active campaign. Please pause it first.' });
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

// Update Campaign Status (Admin)
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
                <a href="${FRONTEND_URL}/dashboard.html" style="background: linear-gradient(135deg, #3dd5c3, #4db8e8); 
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