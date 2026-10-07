const { readConnection, writeConnection } = require("../config/database");
const bookSchema = require("./bookSchema");

// Model cho thao tác ĐỌC (Dùng user read-only)
const ReadBook = readConnection.model("Book", bookSchema, "books");

// Model cho thao tác GHI (Dùng user read-write)
const WriteBook = writeConnection.model("Book", bookSchema, "books");

module.exports = {
    ReadBook,
    WriteBook
};