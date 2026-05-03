require("dotenv").config();
const express = require("express");
const cors = require("cors"); // Đã import
const app = express();

// 1. Cấu hình CORS (Phải đặt TRƯỚC các route)
app.use(cors()); 

// 2. Middleware xử lý JSON
app.use(express.json());

const authRoutes = require("./routes/auth.routes");

// 3. Định nghĩa Route
app.use("/api/auth", authRoutes);

module.exports = app;