const mongoose = require("mongoose");

const rentalOrderSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    plateNo: {
      type: String,
      required: true,
      trim: true,
    },
    carModel: {
      type: String,
      required: true,
      trim: true,
    },
    dailyRate: {
      type: Number,
      required: true,
      min: 0.01,
    },
    pickupAt: {
      type: Date,
      required: true,
    },
    rentalDays: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    expectedReturnAt: {
      type: Date,
      required: true,
    },
    actualReturnAt: {
      type: Date,
    },
    actualDays: {
      type: Number,
      min: 1,
    },
    overdueDays: {
      type: Number,
      min: 0,
    },
    billableDays: {
      type: Number,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "completed"],
      default: "active",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "rentalorders", versionKey: false },
);

module.exports = mongoose.model("RentalOrder", rentalOrderSchema);
