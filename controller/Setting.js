const Setting = require('../models/Setting');
const { encrypt, decrypt } = require('../utils/encryption');

// Allowed keys for dynamic configuration
const ALLOWED_KEYS = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_SECRET',
    'ZEGOCLOUD_APP_ID',
    'ZEGOCLOUD_SERVER_SECRET'
];

// Strictly protected system keys that cannot be modified via this API under any circumstance
const BLOCKED_KEYS = ['JWT_SECRET', 'DB_URL', 'MONGODB_CONNECTION_STRING', 'CONFIG_MASTER_KEY'];

/**
 * Maps the allowed keys to whether they should be stored heavily encrypted.
 * Public identifiers (IDs) remain plaintext. Secrets get encrypted.
 */
const SECRET_KEYS_MAP = {
    'RAZORPAY_KEY_ID': false,
    'RAZORPAY_SECRET': true,
    'ZEGOCLOUD_APP_ID': false,
    'ZEGOCLOUD_SERVER_SECRET': true
};

exports.upsertSetting = async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key || typeof value === 'undefined') {
            return res.status(400).json({ success: false, message: "Provide both 'key' and 'value'" });
        }

        // Security Check 1: Allowed keys
        if (!ALLOWED_KEYS.includes(key)) {
            return res.status(400).json({ success: false, message: `Key '${key}' is not allowed for dynamic configuration.` });
        }

        // Security Check 2: Block sys keys (Redundant based on Check 1, but defense-in-depth)
        if (BLOCKED_KEYS.includes(key)) {
            return res.status(403).json({ success: false, message: `System keys cannot be modified remotely.` });
        }

        const isSecret = SECRET_KEYS_MAP[key] || false;
        
        let targetValue = value;
        if (isSecret) {
            targetValue = encrypt(value);
        }

        // Capture Admin's IP Address for Auditing
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
        
        // Ensure Admin ObjectId is available
        const updatedBy = req.user ? req.user._id : null;

        const updatedSetting = await Setting.findOneAndUpdate(
            { key },
            {
                key,
                value: targetValue,
                isSecret,
                updatedBy,
                lastUpdatedIp: ipAddress
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ 
            success: true, 
            message: `Key '${key}' successfully updated.`,
            data: {
                key: updatedSetting.key,
                isSecret: updatedSetting.isSecret,
                updatedAt: updatedSetting.updatedAt
            }
        });
    } catch (error) {
        console.error("Error upserting setting:", error);
        res.status(500).json({ success: false, message: "Server error while updating setting." });
    }
};

exports.getSettings = async (req, res) => {
    try {
        // Only return configurations. We do NOT decrypt secrets for the API response.
        // If it's a secret, we mask the value entirely for the frontend output.
        const settings = await Setting.find({});
        
        const safeSettings = settings.map(doc => {
            return {
                key: doc.key,
                value: doc.isSecret ? "********" : doc.value,
                isSecret: doc.isSecret,
                updatedAt: doc.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            data: safeSettings
        });
    } catch (error) {
        console.error("Error getting settings:", error);
        res.status(500).json({ success: false, message: "Server error fetching settings." });
    }
};

/**
 * Server-side internal helper mapping dynamic configurations into plaintext.
 * This reads from MongoDB, decrypts if necessary, and caches the result implicitly 
 * depending on usage (Redis cache layer would wrap this eventually).
 */
exports.getPaymentConfig = async () => {
    try {
        const keysToFetch = ['RAZORPAY_KEY_ID', 'RAZORPAY_SECRET'];
        const settings = await Setting.find({ key: { $in: keysToFetch } });
        
        const config = {};
        
        settings.forEach(doc => {
            if (doc.isSecret) {
                config[doc.key] = decrypt(doc.value);
            } else {
                config[doc.key] = doc.value;
            }
        });

        return {
            key_id: config['RAZORPAY_KEY_ID'] || process.env.RAZORPAY_KEY_ID,
            key_secret: config['RAZORPAY_SECRET'] || process.env.RAZORPAY_SECRET
        };
    } catch (error) {
        console.error("FATAL: Error unmasking payment configuration:", error);
        throw error;
    }
};

/**
 * Example controller method illustrating dynamically initializing Razorpay on each request
 * or before a transaction creation flow.
 */
exports.createRazorpayOrderExample = async (req, res) => {
    try {
        const paymentConfig = await exports.getPaymentConfig();

        if (!paymentConfig.key_id || !paymentConfig.key_secret) {
            return res.status(500).json({ success: false, message: "Payment Gateway not configured."});
        }
        
        // Dynamically initialize Razorpay with current keys from MongoDB
        const Razorpay = require('razorpay');
        const instance = new Razorpay({
            key_id: paymentConfig.key_id,
            key_secret: paymentConfig.key_secret
        });
        
        // Example creation payload ...
        // const options = { amount: 50000, currency: "INR" };
        // const order = await instance.orders.create(options);
        
        res.status(200).json({ success: true, message: "Dynamic Razorpay Initialized!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error initializing Razorpay."});
    }
};
