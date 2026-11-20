const mongoose = require("mongoose");

const { connectDatabase } = require("./config/db");
const { CARS } = require("./data/cars");
const Car = require("./models/Car");

async function seedCars() {
  await connectDatabase();

  await Car.deleteMany({});

  for (const carData of CARS) {
    const car = new Car(carData);
    await car.save();
  }

  console.log(`Seeded ${CARS.length} cars.`);
}

if (require.main === module) {
  seedCars()
    .catch((error) => {
      console.error("Failed to seed cars:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = { seedCars };
