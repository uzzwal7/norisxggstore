const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  category:       { type: String, required: true, enum: [
    'Valo Points', 'CS 2 Points', 'Private Steam Accounts',
    'Offline Steam Games', 'PUBG UC Store', 'FreeFire Topup Store',
    'AAA Games', 'Mystery Box', 'Steam Gift Card'
  ]},
  price:         { type: Number, required: true },
  originalPrice: { type: Number },
  rating:        { type: Number, default: 4.5, min: 0, max: 5 },
  sale:          { type: Boolean, default: false },
  isTopSelling:  { type: Boolean, default: false },
  featuredInOffer: { type: Boolean, default: false },
  image:         { type: String, default: 'images/1.png' },
  description:   { type: String },
  stock:         { type: Number, default: 999 },
  active:        { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
