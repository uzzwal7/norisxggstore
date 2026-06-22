// ============================================================
// routes/cartRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { getCart, syncCart, clearCart } = require('../controllers/allControllers');
const { protect } = require('../middleware/authMiddleware');

router.get('/',        protect, getCart);
router.post('/sync',   protect, syncCart);
router.delete('/',     protect, clearCart);

module.exports = router;
