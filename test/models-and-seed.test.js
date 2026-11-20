const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const Car = require("../models/Car");
const RentalOrder = require("../models/RentalOrder");
const { CARS } = require("../data/cars");

const DAY_MS = 24 * 60 * 60 * 1000;
const PICKUP_AT = new Date("2026-11-18T02:00:00.000Z");

function validCar(overrides = {}) {
  return {
    plateNo: "HK-SUV-01",
    brand: "Mercedes-AMG",
    model: "G 63",
    category: "SUV",
    transmission: "Automatic",
    seats: 5,
    dailyRate: 4800,
    description: "Luxury SUV.",
    imagePath: "/images/cars/benz_g63.avif",
    ...overrides,
  };
}

function validOrder(overrides = {}) {
  return {
    username: "customer01",
    customerName: "Chan Tai Man",
    customerPhone: "91234567",
    plateNo: "HK-SUV-01",
    carModel: "G 63",
    dailyRate: 4800,
    pickupAt: PICKUP_AT,
    rentalDays: 3,
    expectedReturnAt: new Date(PICKUP_AT.getTime() + 3 * DAY_MS),
    totalAmount: 14400,
    status: "active",
    notes: "",
    ...overrides,
  };
}

test("Car schema accepts valid vehicle data", async () => {
  await new Car(validCar()).validate();
});

test("Car schema uses min and max validation for seats", async () => {
  await assert.rejects(new Car(validCar({ seats: 0 })).validate(), /minimum/);
  await assert.rejects(new Car(validCar({ seats: 9 })).validate(), /maximum/);
});

test("Car schema rejects unknown categories and non-local image paths", async () => {
  await assert.rejects(new Car(validCar({ category: "Truck" })).validate(), /enum/);
  await assert.rejects(
    new Car(validCar({ imagePath: "https://example.com/car.jpg" })).validate(),
    /invalid/,
  );
});

test("RentalOrder schema accepts a valid active order", async () => {
  await new RentalOrder(validOrder()).validate();
});

test("RentalOrder schema accepts a completed order supplied by the controller", async () => {
  await new RentalOrder(
    validOrder({
      status: "completed",
      actualReturnAt: new Date(PICKUP_AT.getTime() + 3 * DAY_MS),
      actualDays: 3,
      overdueDays: 0,
      billableDays: 3,
    }),
  ).validate();
});

test("RentalOrder schema does not add custom active-car or customer indexes", () => {
  const indexes = RentalOrder.schema.indexes();
  const activeCarIndex = indexes.find(([, options]) => options.name === "one_active_order_per_car");
  const customerIndex = indexes.find(([, options]) => options.name === "customer_bookings");

  assert.equal(activeCarIndex, undefined);
  assert.equal(customerIndex, undefined);
});

test("Car schema does not add a custom category index", () => {
  const indexes = Car.schema.indexes();
  assert.equal(indexes.some(([, options]) => options.name === "category_filter"), false);
});

test("seed data contains seven distinct, model-valid vehicles with seven images", async () => {
  assert.equal(CARS.length, 7);
  assert.equal(new Set(CARS.map((car) => car.plateNo)).size, 7);
  assert.equal(new Set(CARS.map((car) => car.imagePath)).size, 7);
  assert.equal(CARS.some((car) => car.category === "Sport Car"), true);
  assert.equal(
    CARS.every((car) =>
      fs.existsSync(path.join(__dirname, "..", "public", car.imagePath.slice(1))),
    ),
    true,
  );

  await Promise.all(CARS.map((car) => new Car(car).validate()));
});
