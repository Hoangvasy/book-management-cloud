const mongoose = require("mongoose");

const readConnection = mongoose.createConnection(
    process.env.MONGODB_READ_URI
);

const writeConnection = mongoose.createConnection(
    process.env.MONGODB_WRITE_URI
);

readConnection.on("connected", () => {
    console.log("MongoDB READ connection established");
});

writeConnection.on("connected", () => {
    console.log("MongoDB WRITE connection established");
});

readConnection.on("error", (err) => {
    console.error("READ DB error:", err);
});

writeConnection.on("error", (err) => {
    console.error("WRITE DB error:", err);
});

module.exports = {
    readConnection,
    writeConnection
};