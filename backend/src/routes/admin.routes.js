const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/overview", adminController.getOverview);
router.get("/users", adminController.getUsers);
router.get("/businesses", adminController.getBusinesses);
router.get("/bookings", adminController.getBookings);
router.get("/payments", adminController.getPayments);
router.put("/businesses/:id/review", adminController.reviewBusiness);
router.put("/users/:id/status", adminController.updateUserStatus);

module.exports = router;
