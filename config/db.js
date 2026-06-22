const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // Re-use the existing connection on warm serverless invocations instead
  // of reconnecting every time (faster + avoids hitting Atlas connection limits)
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    // On your own PC, fail fast so the problem is obvious.
    // On Vercel, do NOT kill the process — that would crash the whole
    // serverless function for every request sharing that container.
    // Requests will instead get a clear error from the route itself.
    if (!process.env.VERCEL) process.exit(1);
  }
};

module.exports = connectDB;
