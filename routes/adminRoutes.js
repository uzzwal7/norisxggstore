const express = require('express');
const router  = express.Router();
const { getDashboard, getUsers, updateUserRole, deleteUser } = require('../controllers/allControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/dashboard',         protect, adminOnly, getDashboard);
router.get('/users',             protect, adminOnly, getUsers);
router.put('/users/:id/role',    protect, adminOnly, updateUserRole);
router.delete('/users/:id',      protect, adminOnly, deleteUser);

module.exports = router;
