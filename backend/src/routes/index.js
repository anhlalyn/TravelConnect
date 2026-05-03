const express = require("express");
const router = express.Router();

// 1. Import các routes con
const authRoutes = require("./auth.routes");
const postRoutes = require("./post.routes");
const tripRoutes = require("./trip.routes");
const paymentRoutes = require("./payment.routes");
const businessRoutes = require("./business.routes");
const bookingRoutes = require("./booking.routes");
const friendRoutes = require("./friend.routes");
const messageRoutes = require("./message.routes");
const exploreRoutes = require("./explore.routes");
const userRoutes = require("./user.routes");
const notificationRoutes = require("./notification.routes");
const adminRoutes = require("./admin.routes");
const platformRoutes = require("./platform.routes");

// 2. Đăng ký Middleware các route
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/trips", tripRoutes);
router.use("/friends", friendRoutes);
router.use("/businesses", businessRoutes);
router.use("/bookings", bookingRoutes);
router.use("/messages", messageRoutes);
router.use("/explore", exploreRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);
router.use("/platform", platformRoutes);

// 3. Thanh toán: Chỉ dùng 1 dòng duy nhất để dẫn vào file payment.routes.js
router.use("/payments", paymentRoutes);

module.exports = router;
