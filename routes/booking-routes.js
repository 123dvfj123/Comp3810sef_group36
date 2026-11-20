const express = require("express");

const bookingController = require("../controllers/booking-controller");

const router = express.Router();

router.get("/bookings", bookingController.index);
router.get("/bookings/new/:plateNo", bookingController.showNew);
router.post("/bookings/new/:plateNo", bookingController.create);
router.get("/bookings/:id", bookingController.show);
router.get("/bookings/:id/edit", bookingController.showEdit);
router.post("/bookings/:id/update", bookingController.update);
router.post("/bookings/:id/return", bookingController.returnNow);
router.post("/bookings/:id/delete", bookingController.remove);

module.exports = router;
