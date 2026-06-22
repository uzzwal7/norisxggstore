const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount:     { type: Number, required: true },
  discountType: { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
  active:       { type: Boolean, default: true },
  expiresAt:    { type: Date },
  usageLimit:   { type: Number, default: 100 },
  usageCount:   { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
