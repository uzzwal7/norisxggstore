// ============================================================
// FEEDBACK CONTROLLER
// ============================================================
const Feedback  = require('../models/Feedback');
const PromoCode = require('../models/PromoCode');
const User      = require('../models/User');
const Order     = require('../models/Order');
const Product   = require('../models/Product');
const Notification = require('../models/Notification');

// POST /api/feedback
const createFeedback = async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    if (!name || !email || !rating || !message)
      return res.status(400).json({ message: 'All fields required' });

    const fb = await Feedback.create({ name, email, rating: Number(rating), message });
    res.status(201).json(fb);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/feedback  (admin)
const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/feedback/:id  (admin)
const deleteFeedback = async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/feedback/stats  (public - real average rating shown on homepage)
const getFeedbackStats = async (req, res) => {
  try {
    const all = await Feedback.find().select('rating');
    const count = all.length;
    const average = count ? all.reduce((sum, f) => sum + f.rating, 0) / count : 0;

    // Up to 3 most recent 4-5 star reviews, for the About page testimonials
    const topReviews = await Feedback.find({ rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name rating message');

    res.json({ average: Math.round(average * 10) / 10, count, topReviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================
// PROMO CODE CONTROLLER
// ============================================================

// POST /api/promo/apply  (protected)
const applyPromo = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const promo = await PromoCode.findOne({ code: code?.toUpperCase(), active: true });

    if (!promo) return res.status(404).json({ message: 'Invalid promo code' });
    if (promo.expiresAt && promo.expiresAt < Date.now())
      return res.status(400).json({ message: 'Promo code has expired' });
    if (promo.usageCount >= promo.usageLimit)
      return res.status(400).json({ message: 'Promo code usage limit reached' });

    const discount = promo.discountType === 'percent'
      ? Math.round(cartTotal * promo.discount / 100)
      : promo.discount;

    res.json({ code: promo.code, discount, discountType: promo.discountType, message: `Promo applied: Rs. ${discount} off!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/promo  (admin - create)
const createPromo = async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);
    res.status(201).json(promo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/promo  (admin)
const getAllPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json(promos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/promo/:id  (admin)
const deletePromo = async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promo code deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/promo/:id  (admin - toggle active)
const updatePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promo) return res.status(404).json({ message: 'Promo not found' });
    res.json(promo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================
// ADMIN CONTROLLER
// ============================================================

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalFeedback, orders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ active: true }),
      Order.countDocuments(),
      Feedback.countDocuments(),
      Order.find({ status: { $ne: 'cancelled' } }).select('total status paymentStatus')
    ]);

    const totalRevenue  = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const paidOrders    = orders.filter(o => o.paymentStatus === 'paid').length;

    // Recent 5 orders
    const recentOrders = await Order.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ totalUsers, totalProducts, totalOrders, totalFeedback, totalRevenue, pendingOrders, paidOrders, recentOrders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete your own account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cart sync - GET /api/cart
const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('cart');
    res.json({ cart: user.cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cart sync - POST /api/cart/sync
const syncCart = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { cart: req.body.cart });
    res.json({ message: 'Cart synced' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cart clear - DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { cart: [] });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================
// NOTIFICATION CONTROLLER
// ============================================================

// POST /api/notifications  (admin - send a message to a user, usually about an order)
const sendNotification = async (req, res) => {
  try {
    const { userId, message, type, orderId } = req.body;
    if (!userId || !message)
      return res.status(400).json({ message: 'userId and message are required' });

    const notif = await Notification.create({
      user: userId,
      order: orderId || undefined,
      message,
      type: type || 'info'
    });
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notifications/mine  (protected - logged-in user's own notifications)
const getMyNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/:id/read  (protected - mark one as read)
const markNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notifications/:id  (protected - user deletes their own notification)
const deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createFeedback, getAllFeedback, deleteFeedback, getFeedbackStats,
  applyPromo, createPromo, getAllPromos, deletePromo, updatePromo,
  getDashboard, getUsers, updateUserRole, deleteUser,
  getCart, syncCart, clearCart,
  sendNotification, getMyNotifications, markNotificationRead, deleteNotification
};
