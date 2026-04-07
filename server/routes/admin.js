const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/adminMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  getAllProducts,
  getAllOrders,
  blockUnblockUser,
  deleteUser,
  deleteProduct,
  getReports,
  updateReportStatus,
} = require('../controllers/adminController');

router.get('/stats', auth, admin, getDashboardStats);

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', auth, admin, getAllUsers);

// @route   GET api/admin/products
// @desc    Get all products
// @access  Private/Admin
router.get('/products', auth, admin, getAllProducts);

router.get('/orders', auth, admin, getAllOrders);

router.put('/users/:id/block-toggle', auth, admin, blockUnblockUser);

// @route   DELETE api/admin/users/:id
// @desc    Delete user and their products
// @access  Private/Admin
router.delete('/users/:id', auth, admin, deleteUser);

// @route   DELETE api/admin/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/products/:id', auth, admin, deleteProduct);

router.get('/reports', auth, admin, getReports);
router.put('/reports/:id', auth, admin, updateReportStatus);

module.exports = router;
