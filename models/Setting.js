const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    value: {
        type: String,
        required: true,
    },
    isSecret: {
        type: Boolean,
        default: false,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', // Match the 'user' model name
        required: false, // Optional if updated via internal script initially
    },
    lastUpdatedIp: {
        type: String,
        required: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
