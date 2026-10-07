const mongoose = require("mongoose");
const { readConnection, writeConnection } = require("../config/database");

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

// Model cho thao tác ĐỌC (READ USER)
const BookRead = readConnection.model("Book", bookSchema, "books");

// Model cho thao tác GHI (WRITE USER)
const BookWrite = writeConnection.model("Book", bookSchema, "books");

module.exports = {
    BookRead,
    BookWrite
};