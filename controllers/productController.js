const Product = require('../models/Product');

// Seed the original 18 products on first run
const seedProducts = async () => {
  const count = await Product.countDocuments();
  if (count > 0) return;

  const initial = [
    { name: "FC26 Standard Edition",         category: "Private Steam Accounts",  price: 500,  originalPrice: 2999, rating: 4.9, sale: true, isTopSelling: true,  featuredInOffer: true,  image: "images/1.png",   description: "Private Steam Account with lifetime access to FC26 Standard Edition. Full online multiplayer support." },
    { name: "Valorant VP 1000 Points",       category: "Valo Points",             price: 850,  originalPrice: 950,  rating: 4.8, sale: true, isTopSelling: true,  featuredInOffer: false, image: "images/2.png",   description: "Valorant VP Points Gift Card (India/Nepal Region). Redeemable directly in game client." },
    { name: "Valorant VP 5000 Points",       category: "Valo Points",             price: 3800, originalPrice: 4200, rating: 4.9, sale: true, isTopSelling: false, featuredInOffer: true,  image: "images/2.png",   description: "Valorant VP Points Gift Card (India/Nepal Region). Secure and instant VP top-up." },
    { name: "Steam Gift Card $10 (Global)",  category: "Steam Gift Card",         price: 1350, originalPrice: 1500, rating: 4.7, sale: true, isTopSelling: true,  featuredInOffer: false, image: "images/3.png",   description: "Steam Wallet Code $10 Global Region. Valid for activation on all accounts." },
    { name: "Steam Gift Card $50 (Global)",  category: "Steam Gift Card",         price: 6500, originalPrice: 7000, rating: 4.9, sale: true, isTopSelling: false, featuredInOffer: true,  image: "images/5.png",   description: "Steam Wallet Code $50 Global Region. Instant wallet top-up code." },
    { name: "GTA V - Offline Edition",       category: "Offline Steam Games",     price: 400,  originalPrice: 800,  rating: 4.6, sale: true, isTopSelling: true,  featuredInOffer: false, image: "images/4.png",   description: "Steam Offline Mode Account. Complete Story Mode play with easy setup instructions." },
    { name: "Spiderman-2 Deluxe",            category: "AAA Games",               price: 200,  originalPrice: 400,  rating: 4.8, sale: true, isTopSelling: true,  featuredInOffer: false, image: "images/6.png",   description: "PC Steam Offline Account access to Marvel's Spiderman 2 Deluxe Edition." },
    { name: "Ghost of Tsushima",             category: "AAA Games",               price: 200,  originalPrice: 400,  rating: 4.9, sale: true, isTopSelling: false, featuredInOffer: true,  image: "images/7.png",   description: "PC Steam Offline Account access to Ghost of Tsushima: Director's Cut." },
    { name: "Black Myth: Wukong",            category: "AAA Games",               price: 1200, originalPrice: 1800, rating: 5.0, sale: true, isTopSelling: true,  featuredInOffer: true,  image: "images/8.png",   description: "Black Myth Wukong offline Steam account setup. Experience the legendary action RPG." },
    { name: "Elden Ring + Shadow of Erdtree",category: "AAA Games",               price: 999,  originalPrice: 1590, rating: 4.9, sale: true, isTopSelling: false, featuredInOffer: false, image: "images/11.png",  description: "Elden Ring base game + Shadow of the Erdtree DLC offline Steam Account access." },
    { name: "PUBG Mobile 325 UC Pack",       category: "PUBG UC Store",           price: 680,  originalPrice: 750,  rating: 4.7, sale: true, isTopSelling: false, featuredInOffer: false, image: "images/111.png", description: "Direct PUBG Mobile UC Top-up. Sent via official Character ID input." },
    { name: "PUBG Mobile 660 UC Pack",       category: "PUBG UC Store",           price: 1320, originalPrice: 1450, rating: 4.8, sale: true, isTopSelling: true,  featuredInOffer: true,  image: "images/12.png",  description: "Direct PUBG Mobile UC Top-up. Character ID required at checkout." },
    { name: "FreeFire 210 Diamonds",         category: "FreeFire Topup Store",    price: 230,  originalPrice: 250,  rating: 4.5, sale: true, isTopSelling: false, featuredInOffer: false, image: "images/123.png", description: "Garena Free Fire diamonds top-up via Player UID." },
    { name: "FreeFire 1080 Diamonds",        category: "FreeFire Topup Store",    price: 1050, originalPrice: 1200, rating: 4.7, sale: true, isTopSelling: false, featuredInOffer: true,  image: "images/112.png", description: "Garena Free Fire diamond top-up bundle via Player UID." },
    { name: "Random Steam Key (Mystery)",    category: "Mystery Box",             price: 150,  originalPrice: 500,  rating: 4.2, sale: true, isTopSelling: true,  featuredInOffer: false, image: "images/56.png",  description: "Mystery box bundle. Redeem 1 random premium Steam key worth up to Rs. 2,000." },
    { name: "CS2 Prime Accounts Key",        category: "CS 2 Points",             price: 899,  originalPrice: 1500, rating: 4.8, sale: true, isTopSelling: true,  featuredInOffer: false, image: "images/c.png",   description: "CS2 Prime matchmaking accounts activation keys. Rank up without restrictions." },
    { name: "Private Steam (RDR2 + CP2077)", category: "Private Steam Accounts",  price: 750,  originalPrice: 1200, rating: 4.7, sale: true, isTopSelling: false, featuredInOffer: false, image: "images/n.png",   description: "Private Steam account access loaded with Red Dead Redemption 2 & Cyberpunk 2077." },
    { name: "Supermarket Simulator",         category: "Offline Steam Games",     price: 10,   originalPrice: 100,  rating: 4.5, sale: true, isTopSelling: false, featuredInOffer: false, image: "images/cv.png",  description: "Steam offline mode account. Manage your supermarket store at only Rs. 10." }
  ];

  await Product.insertMany(initial);
  console.log('✅ Database seeded with 18 products');
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort } = req.query;
    const query = { active: true };

    if (category && category !== 'all') query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    let sortObj = {};
    if (sort === 'price-low')  sortObj.price  = 1;
    else if (sort === 'price-high') sortObj.price = -1;
    else if (sort === 'rating') sortObj.rating = -1;
    else sortObj.createdAt = -1;

    const products = await Product.find(query).sort(sortObj);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/products  (admin)
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/products/:id  (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/products/:id  (admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { seedProducts, getProducts, getProductById, createProduct, updateProduct, deleteProduct };
