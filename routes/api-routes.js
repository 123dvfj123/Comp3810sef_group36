const express = require("express");

const apiBookingController = require("../controllers/api-booking-controller");

const router = express.Router();

router.get("/bookings", apiBookingController.list);
router.post("/bookings", apiBookingController.create);
router.put("/bookings/:id", apiBookingController.update);
router.delete("/bookings/:id", apiBookingController.remove);

module.exports = router;
