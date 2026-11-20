const express = require("express");

const {
  listCars,
  showCar,
} = require("../controllers/car-controller");

const router = express.Router();

router.get("/cars", listCars);
router.get("/cars/:plateNo", showCar);

module.exports = router;
