const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:  String,
  price: Number,
  image: String,
  qty:   Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:         [orderItemSchema],
  subtotal:      Number,
  promoCode:     String,
  discount:      { type: Number, default: 0 },
  total:         Number,
  paymentMethod: { type: String, enum: ['esewa', 'khalti', 'imepay', 'card', 'cod'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  status:        { type: String, enum: ['pending', 'processing', 'completed', 'cancelled'], default: 'pending' },
  customerNote:  String,

  // ── Checkout details collected at order time (so the admin can fulfill it) ──
  customerEmail:   { type: String, required: true },
  customerPhone:   { type: String, required: true },
  customerAddress: { type: String },
  customerRating:  { type: Number, required: true, min: 1, max: 5 },
  customerFeedback: { type: String },
  // Delivery fee for Pay-on-Delivery orders: Rs.99 inside Kathmandu Valley, Rs.299 outside
  deliveryCharge: { type: Number, default: 0 },
  // Screenshot of the wallet payment, stored as a base64 data URL. Not required for COD.
  paymentScreenshot: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
