const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adshark00:0KKX2YSBGY9Zrz21@cluster0.g7lpz.mongodb.net/adsteric?retryWrites=true&w=majority&appName=Cluster0';

// User Schema
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  balance: Number,
  totalSpent: Number,
  currentPackage: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function resetBalances() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    // Find all users with balance greater than 0
    const usersWithBalance = await User.find({ balance: { $gt: 0 } });
    console.log(`Found ${usersWithBalance.length} users with non-zero balance`);

    if (usersWithBalance.length > 0) {
      console.log('\nUsers to update:');
      usersWithBalance.forEach(user => {
        console.log(`- ${user.email}: Balance ${user.balance} -> 0`);
      });

      // Update all users to have balance of 0
      const result = await User.updateMany(
        { balance: { $gt: 0 } },
        { $set: { balance: 0 } }
      );

      console.log(`\n✅ Successfully updated ${result.modifiedCount} users`);
    } else {
      console.log('\n✅ All users already have balance of 0');
    }

    // Verify the update
    const remainingBalance = await User.find({ balance: { $gt: 0 } });
    console.log(`\nVerification: ${remainingBalance.length} users still have non-zero balance`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

resetBalances();