const { ReadBook, WriteBook } = require("../models/bookModels");

// Hàm phụ trợ tính VAT theo đề bài: (Chữ số cuối MSSV) + 6
function getVAT() {
    const mssv = process.env.MSSV || "23IT241";
    // Lấy chỉ các chữ số từ chuỗi MSSV
    const digitsOnly = mssv.replace(/\D/g, '');
    const lastDigit = Number(digitsOnly[digitsOnly.length - 1]) || 0;
    return lastDigit + 6;
}

// 1. Lấy danh sách sách (Dùng ReadBook -> MongoDB READ User)
exports.getBooks = async (req, res) => {
    try {
        const books = await ReadBook.find().lean();
        const vat = getVAT();

        res.render("books", {
            books,
            fullName: process.env.FULL_NAME || "Hoang Van Sy",
            mssv: process.env.MSSV || "23IT241",
            vat
        });
    } catch (error) {
        console.error("Lỗi đọc dữ liệu:", error);
        res.status(500).send("Lỗi đọc dữ liệu từ Database READ");
    }
};

// 2. Thêm mới sách (Dùng WriteBook -> MongoDB WRITE User)
exports.createBook = async (req, res) => {
    try {
        const { productCode, name, priceBeforeTax } = req.body;
        const mssv = process.env.MSSV || "23IT241";
        
        // Lấy 3 số cuối MSSV (Ví dụ "23IT241" -> "241")
        const prefix = mssv.slice(-3);

        // Kiểm tra mã sản phẩm phải bắt đầu bằng prefix
        if (!productCode || !productCode.startsWith(prefix)) {
            return res.status(400).send(`Mã sản phẩm phải bắt đầu bằng '${prefix}' (Ví dụ: ${prefix}BOOK01)`);
        }

        const price = Number(priceBeforeTax) || 0;
        const vat = getVAT();
        const priceAfterTax = price + (price * vat) / 100;

        // Lưu vào DB WRITE
        await WriteBook.create({
            productCode: productCode.trim(),
            name,
            priceBeforeTax: price,
            vat,
            priceAfterTax
        });

        res.redirect("/books");
    } catch (error) {
        console.error("Lỗi ghi dữ liệu:", error);
        if (error.code === 11000) {
            return res.status(400).send("Mã sản phẩm này đã tồn tại trong hệ thống!");
        }
        res.status(500).send("Lỗi ghi dữ liệu vào Database WRITE");
    }
};