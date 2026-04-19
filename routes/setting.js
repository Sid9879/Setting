const express = require('express');
const router = express.Router();
const settingController = require('../controller/Setting');
const adminAuth = require('../middleware/adminAuth');

// Protected Routes (Admin Only)
router.post('/upsert', adminAuth, settingController.upsertSetting);
router.get('/keys', adminAuth, settingController.getSettings);

// Example testing route (In production this would just be internal logic)
router.post('/test-razorpay-init', adminAuth, settingController.createRazorpayOrderExample);

module.exports = router;
