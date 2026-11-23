const Car = require("../models/Car");
const RentalOrder = require("../models/RentalOrder");
const asyncHandler = require("../middleware/async-handler");
const HttpError = require("../middleware/http-error");
const { CATEGORIES } = require("../models/car-categories");

const AVAILABILITY_VALUES = ["Available", "Rented"];

async function getRentedPlates() {
  const activeOrders = await RentalOrder.find({ status: "active" })
    .select("plateNo")
    .lean();

  return new Set(activeOrders.map((order) => order.plateNo));
}

const listCars = asyncHandler(async (req, res) => {
  const category = String(req.query.category || "").trim();
  const availability = String(req.query.availability || "").trim();

  if (category && !CATEGORIES.includes(category)) {
    throw new HttpError(400, "INVALID_FILTER", "Unknown vehicle category.");
  }

  if (availability && !AVAILABILITY_VALUES.includes(availability)) {
    throw new HttpError(400, "INVALID_FILTER", "Unknown availability value.");
  }

  const query = category ? { category } : {};
  const [cars, rentedPlates] = await Promise.all([
    Car.find(query).sort({ plateNo: 1 }).lean(),
    getRentedPlates(),
  ]);
  const carsWithAvailability = cars.map((car) => ({
    ...car,
    availability: rentedPlates.has(car.plateNo) ? "Rented" : "Available",
  }));
  const filteredCars = availability
    ? carsWithAvailability.filter((car) => car.availability === availability)
    : carsWithAvailability;

  return res.status(200).render("cars/index", {
    title: "Browse Cars",
    cars: filteredCars,
    categories: CATEGORIES,
    selectedCategory: category,
    selectedAvailability: availability,
  });
});

const showCar = asyncHandler(async (req, res) => {
  const plateNo = String(req.params.plateNo || "").trim();
  const [car, activeOrder] = await Promise.all([
    Car.findOne({ plateNo }).lean(),
    RentalOrder.exists({ plateNo, status: "active" }),
  ]);

  if (!car) {
    throw new HttpError(404, "CAR_NOT_FOUND", "The requested car does not exist.");
  }

  return res.status(200).render("cars/show", {
    title: `${car.brand} ${car.model}`,
    car: {
      ...car,
      availability: activeOrder ? "Rented" : "Available",
    },
  });
});

module.exports = { listCars, showCar };
