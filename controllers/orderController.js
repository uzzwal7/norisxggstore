const Order  = require('../models/Order');
const User   = require('../models/User');
const PromoCode = require('../models/PromoCode');

// POST /api/orders  (protected - place order)
const createOrder = async (req, res) => {
  try {
    const {
      items, promoCode, paymentMethod, customerNote,
      customerEmail, customerPhone, customerAddress,
      customerRating, customerFeedback, paymentScreenshot, deliveryCharge
    } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Cart is empty' });

    if (!customerEmail || !customerPhone)
      return res.status(400).json({ message: 'Email and phone number are required' });

    if (!customerRating || customerRating < 1 || customerRating > 5)
      return res.status(400).json({ message: 'Please rate your experience (1 to 5 stars) to place the order' });

    const method = paymentMethod || 'cod';
    if (method !== 'cod' && !paymentScreenshot)
      return res.status(400).json({ message: 'Please upload a screenshot of your payment to proceed' });

    if (method === 'cod' && !customerAddress)
      return res.status(400).json({ message: 'Delivery address is required for Pay on Delivery' });

    // Delivery fee only applies to Pay on Delivery, and only the two allowed values are trusted
    let validatedDeliveryCharge = 0;
    if (method === 'cod') {
      validatedDeliveryCharge = (Number(deliveryCharge) === 299) ? 299 : 99;
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    let discount = 0;
    let appliedCode = null;

    // Validate promo code if provided
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), active: true });
      if (promo) {
        if (!promo.expiresAt || promo.expiresAt > Date.now()) {
          if (promo.usageCount < promo.usageLimit) {
            discount = promo.discountType === 'percent'
              ? Math.round(subtotal * promo.discount / 100)
              : promo.discount;
            appliedCode = promo.code;
            promo.usageCount += 1;
            await promo.save();
          }
        }
      }
    }

    const total = Math.max(0, subtotal - discount) + validatedDeliveryCharge;

    const order = await Order.create({
      user: req.user._id,
      items,
      subtotal,
      promoCode: appliedCode,
      discount,
      total,
      paymentMethod: method,
      customerNote,
      customerEmail,
      customerPhone,
      customerAddress,
      customerRating,
      customerFeedback,
      deliveryCharge: validatedDeliveryCharge,
      paymentScreenshot: method !== 'cod' ? paymentScreenshot : undefined
    });

    // Clear user's server cart after order
    await User.findByIdAndUpdate(req.user._id, { cart: [] });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/mine  (protected - user's own orders)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders  (admin - all orders)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/status  (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'username email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/:id  (admin or owner)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'username email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/orders/:id  (admin - only after order is completed or cancelled)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'completed' && order.status !== 'cancelled')
      return res.status(400).json({ message: 'Only completed or cancelled orders can be deleted' });

    await order.deleteOne();
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus, getOrderById, deleteOrder };
