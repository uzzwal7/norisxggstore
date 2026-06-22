const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // optional, links notification to an order
  message: { type: String, required: true },
  type:    { type: String, enum: ['info', 'success', 'error'], default: 'info' },
  read:    { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
