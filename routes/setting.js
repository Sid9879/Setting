const express = require('express');
const router = express.Router();
const settingController = require('../controller.js/Setting');

// Route to update or add an env variable
router.post('/update-env', settingController.updateEnvVariable);

module.exports = router;
