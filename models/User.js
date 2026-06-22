const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  price: Number,
  image: String,
  qty: { type: Number, default: 1 }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, required: true },
  address:   { type: String, required: true },
  country:   { type: String, required: true },
  postal:    { type: String, required: true },
  password:  { type: String, required: true, minlength: 6 },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  cart:      [cartItemSchema],
  resetPasswordToken:  String,
  resetPasswordExpire: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
