const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

/**
 * Middleware to verify a valid JWT token and ensure the user role is 'admin'.
 */
const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'Access Denied: No token provided.' });
        }

        const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access Denied: Invalid token format.' });
        }

        const decoded = jwt.verify(token, config.jwtSecret.jwtSecret || process.env.JWT_SECRET);
        
        // Find user to verify they still exist and check their precise role in DB
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Access Denied: User not found.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
        }

        // Attach parsed user onto request
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Access Denied: Token expired.' });
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Invalid token.', error: err.message });
    }
};

module.exports = adminAuth;
