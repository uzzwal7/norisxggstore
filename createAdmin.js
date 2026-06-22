// Run this once after registering your account on the site:
//   node createAdmin.js your-email@example.com
//
// It will find that user and upgrade their role to 'admin'.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = process.argv[2];

if (!email) {
  console.log('Usage: node createAdmin.js your-email@example.com');
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.log(`❌ No user found with email: ${email}`);
    console.log('   Register an account on the website first, then run this script.');
  } else {
    console.log(`✅ ${user.username} (${user.email}) is now an ADMIN.`);
    console.log('   You can now log in at /admin with this email and your password.');
  }

  await mongoose.disconnect();
  process.exit(0);
})();
