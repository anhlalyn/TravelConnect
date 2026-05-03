// src/routes/trip.routes.js
const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const authMiddleware = require('../middlewares/auth.middleware');

// 1. Routes tĩnh (Không có :id ở giữa)
router.get('/trending', authMiddleware, tripController.getTrendingPlaces);
router.post('/activity', authMiddleware, tripController.addTripActivity);
router.delete('/activity/:id', authMiddleware, tripController.deleteActivity);

// 2. Routes cơ bản
router.get('/', authMiddleware, tripController.getAllTrips);
router.post('/', authMiddleware, tripController.createTrip);

// 3. Routes động (Có :id) - ĐỂ DƯỚI CÙNG
router.get('/:id', authMiddleware, tripController.getTripDetails);
router.put('/:id', authMiddleware, tripController.updateTrip);
router.delete('/:id', authMiddleware, tripController.deleteTrip);

module.exports = router;