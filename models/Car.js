const mongoose = require("mongoose");
const { CATEGORIES } = require("../lib/car-categories");

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

module.exports = mongoose.model("Car", carSchema);
