const express = require('express');
const router  = express.Router();
const { createOrder, getMyOrders, getAllOrders, updateOrderStatus, getOrderById, deleteOrder } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/',              protect, createOrder);
router.get('/mine',           protect, getMyOrders);
router.get('/',               protect, adminOnly, getAllOrders);
router.get('/:id',            protect, getOrderById);
router.put('/:id/status',     protect, adminOnly, updateOrderStatus);
router.delete('/:id',         protect, adminOnly, deleteOrder);

module.exports = router;
