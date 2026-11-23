const mongoose = require("mongoose");

const CATEGORIES = ["SUV", "Sedan", "MPV", "Sport Car"];

const carSchema = new mongoose.Schema(
  {
    plateNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    transmission: {
      type: String,
      required: true,
      enum: ["Automatic", "Manual"],
    },
    seats: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    dailyRate: {
      type: Number,
      required: true,
      min: 0.01,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    imagePath: {
      type: String,
      required: true,
      match: /^\/images\/cars\//,
    },
  },
  { collection: "cars", versionKey: false },
);

const Car = mongoose.model("Car", carSchema);

module.exports = Car;
module.exports.CATEGORIES = CATEGORIES;
