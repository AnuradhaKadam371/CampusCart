const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    category: {
        type: String,
        required: true,
        enum: ['Calculator','Notes','Books','Projects','Hardware','Other']
    },

    images: [
        {
            type: String,
            required: true
        }
    ],

    pickupLocation: {
        type: String
    },

    contactPreference: {
        type: String
    },

    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    status: {
        type: String,
        enum: ['available','sold'],
        default: 'available'
    },

    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Product', ProductSchema);