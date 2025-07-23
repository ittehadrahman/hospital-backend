const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    generic: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    currentStock: {
        type: Number,
        required: true,
        min: 0
    },
    batches: [{
        batchNumber: {
            type: String,
            required: true,
        },
        expiryDate: {
            type: Date,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const Medicine = mongoose.model('Medicine', medicineSchema);
module.exports = Medicine;