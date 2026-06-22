const express = require('express');
const router  = express.Router();
const { applyPromo, createPromo, getAllPromos, deletePromo, updatePromo } = require('../controllers/allControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/apply',  protect, applyPromo);
router.get('/',        protect, adminOnly, getAllPromos);
router.post('/',       protect, adminOnly, createPromo);
router.put('/:id',     protect, adminOnly, updatePromo);
router.delete('/:id',  protect, adminOnly, deletePromo);

module.exports = router;
