// ============================================================
// routes/feedbackRoutes.js
// ============================================================
const express  = require('express');
const router   = express.Router();
const { createFeedback, getAllFeedback, deleteFeedback, getFeedbackStats } = require('../controllers/allControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/',       createFeedback);
router.get('/stats',   getFeedbackStats);   // public — powers the real rating shown on the homepage
router.get('/',        protect, adminOnly, getAllFeedback);
router.delete('/:id',  protect, adminOnly, deleteFeedback);

module.exports = router;
