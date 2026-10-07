const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    productCode: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    priceBeforeTax: {
        type: Number,
        required: true
    },
    vat: {
        type: Number,
        required: true
    },
    priceAfterTax: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = bookSchema;