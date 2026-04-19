const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

// Helper to get exactly a 32-byte key
function getEncryptionKey() {
    const rawKey = process.env.CONFIG_MASTER_KEY;
    if (!rawKey) {
        throw new Error('FATAL: process.env.CONFIG_MASTER_KEY must be defined for secure configuration.');
    }
    // Hash the given key to ensure it's exactly 32 bytes (256 bits)
    return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts a plain text string using AES-256-CBC.
 * @param {string} text - The plain text string to encrypt.
 * @returns {string} The initialized vector and encrypted data, hex encoded.
 */
function encrypt(text) {
    if (!text) return text;
    
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // 16 bytes IV for AES
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return the IV and encrypted text joined by a colon
    return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted string using AES-256-CBC.
 * @param {string} encryptedText - The encrypted string (iv:encrypted_data).
 * @returns {string} The decrypted plain text.
 */
function decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;

    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted format.');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

module.exports = {
    encrypt,
    decrypt
};
