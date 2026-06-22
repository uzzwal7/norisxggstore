const express = require('express');
const router  = express.Router();
const { sendNotification, getMyNotifications, markNotificationRead, deleteNotification } = require('../controllers/allControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/',          protect, adminOnly, sendNotification);
router.get('/mine',       protect, getMyNotifications);
router.put('/:id/read',   protect, markNotificationRead);
router.delete('/:id',     protect, deleteNotification);

module.exports = router;
