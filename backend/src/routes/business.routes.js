const express = require("express");
const router = express.Router();
const businessCtrl = require("../controllers/businessController");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/featured", businessCtrl.getFeaturedBusinesses);
router.get("/kdl/services", authMiddleware, businessCtrl.getMyServices);
router.post("/kdl/services", authMiddleware, businessCtrl.createService);
router.put("/kdl/services/:id", authMiddleware, businessCtrl.updateService);
router.delete("/kdl/services/:id", authMiddleware, businessCtrl.deleteService);
router.get("/kdl/reviews", authMiddleware, businessCtrl.getMyReviews);
router.get("/kdl/analytics", authMiddleware, businessCtrl.getAnalytics);
router.get("/:id/services", businessCtrl.getServicesByBusiness);
router.get("/:id", businessCtrl.getBusinessDetail);

module.exports = router;
