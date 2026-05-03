const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/kdl/bookings", authMiddleware, bookingController.getBookingsForKDL);
router.get("/kdl/bookings/:id", authMiddleware, bookingController.getBookingDetail);
router.put("/kdl/bookings/:id", authMiddleware, bookingController.updateBookingStatus);
router.get("/kdl/stats", authMiddleware, bookingController.getBookingStats);
router.post("/kdl/scan-qr", authMiddleware, bookingController.verifyTicketByQr);

router.post("/", authMiddleware, bookingController.createBooking);
router.get("/my-bookings", authMiddleware, bookingController.getMyBookings);
router.post("/:id/regenerate-qr", authMiddleware, bookingController.regenerateBookingQr);
router.delete("/:id", authMiddleware, bookingController.cancelBooking);

module.exports = router;
