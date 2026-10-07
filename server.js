require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { engine } = require('express-handlebars');

const app = express();

// --- MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- HANDLEBARS VIEW ENGINE ---
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// --- DATABASE CONNECTIONS (READ & WRITE) ---
const readConnection = mongoose.createConnection(process.env.MONGODB_READ_URI);
readConnection.on('connected', () => console.log('✅ Đã kết nối MongoDB Atlas [READ connection]'));
readConnection.on('error', (err) => console.error('❌ Lỗi kết nối MongoDB READ:', err.message));

const writeConnection = mongoose.createConnection(process.env.MONGODB_WRITE_URI);
writeConnection.on('connected', () => console.log('✅ Đã kết nối MongoDB Atlas [WRITE connection]'));
writeConnection.on('error', (err) => console.error('❌ Lỗi kết nối MongoDB WRITE:', err.message));

// --- MONGOOSE SCHEMA & MODELS ---
const bookSchema = new mongoose.Schema(
    {
        productCode: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        priceBeforeTax: { type: Number, required: true },
        vat: { type: Number, required: true },
        priceAfterTax: { type: Number, required: true }
    },
    { timestamps: true, collection: 'books' }
);

const BookRead = readConnection.model('Book', bookSchema);
const BookWrite = writeConnection.model('Book', bookSchema);

// --- STATELESS SESSION SETUP ---
// Tự động xử lý sự khác biệt giữa các phiên bản connect-mongo
const mongoUrl = process.env.SESSION_URI || process.env.MONGODB_WRITE_URI;
let storeInstance;

if (typeof MongoStore.create === 'function') {
    storeInstance = MongoStore.create({ mongoUrl });
} else if (typeof MongoStore === 'function') {
    storeInstance = new MongoStore({ mongoUrl });
} else if (MongoStore.default && typeof MongoStore.default.create === 'function') {
    storeInstance = MongoStore.default.create({ mongoUrl });
}

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'super_secret_key_23IT241',
        resave: false,
        saveUninitialized: false,
        store: storeInstance,
        cookie: {
            maxAge: 1000 * 60 * 60 // 1 giờ
        }
    })
);

// --- TÍNH VAT ĐỘNG THEO MSSV (23IT241 -> 7%) ---
const mssv = process.env.MSSV || "23IT241";
const digitsOnly = mssv.replace(/\D/g, '');
const lastDigit = Number(digitsOnly[digitsOnly.length - 1]) || 0;
const VAT_PERCENT = lastDigit + 4;
 
console.log(`📌 MSSV: ${mssv} | VAT áp dụng: ${VAT_PERCENT}%`);

// --- ROUTES ---

app.get('/', (req, res) => {
    res.redirect('/books');
});

// GET /books - Danh sách sách (Dùng BookRead)
app.get('/books', async (req, res) => {
    try {
        const books = await BookRead.find().lean();
        res.render('books', {
            books,
            fullName: process.env.FULL_NAME || 'Hoang Van Sy',
            mssv,
            vat: VAT_PERCENT
        });
    } catch (error) {
        res.status(500).send('Lỗi đọc dữ liệu từ DB READ: ' + error.message);
    }
});

// POST /books - Thêm sách mới (Dùng BookWrite)
app.post('/books', async (req, res) => {
    try {
        const { productCode, name, priceBeforeTax } = req.body;

        if (!productCode || !name || priceBeforeTax === undefined) {
            return res.status(400).send('Vui lòng nhập đủ productCode, name và priceBeforeTax!');
        }

        // Validate tiền tố 3 số cuối MSSV ("241")
        const requiredPrefix = mssv.slice(-3);
        if (!productCode.startsWith(requiredPrefix)) {
            return res.status(400).send(`Mã sản phẩm phải bắt đầu bằng '${requiredPrefix}' (Ví dụ: ${requiredPrefix}BOOK01)`);
        }

        const priceNum = Number(priceBeforeTax) || 0;
        const priceAfterTax = priceNum * (1 + VAT_PERCENT / 100);

        const newBook = new BookWrite({
            productCode: productCode.trim(),
            name,
            priceBeforeTax: priceNum,
            vat: VAT_PERCENT,
            priceAfterTax
        });

        await newBook.save();
        res.redirect('/books');

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).send('Mã productCode này đã tồn tại!');
        }
        res.status(500).send('Lỗi ghi dữ liệu vào DB WRITE: ' + error.message);
    }
});

// API BACKUP (JSON Pure)
app.get('/api/books', async (req, res) => {
    try {
        const books = await BookRead.find();
        res.json({ success: true, vatApplied: `${VAT_PERCENT}%`, data: books });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- CHẠY SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});