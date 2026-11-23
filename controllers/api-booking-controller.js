const mongoose = require("mongoose");

const { users } = require("../config/users");
const Car = require("../models/Car");
const RentalOrder = require("../models/RentalOrder");
const asyncHandler = require("../middleware/async-handler");
const HttpError = require("../middleware/http-error");
const {
  calculateEstimatedAmount,
  calculateExpectedReturnAt,
  isOverdue,
  isValidRentalDays,
} = require("../models/rental-rules");

const USERNAMES = new Set(users.map((user) => user.username));

function requiredText(body, fieldName) {
  const value = body[fieldName];

  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, "INVALID_INPUT", `${fieldName} is required.`);
  }

  return value.trim();
}

function readRentalDays(value) {
  if (!isValidRentalDays(value)) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "rentalDays must be an integer from 1 to 30.",
    );
  }

  return value;
}

function readNotes(body) {
  if (body.notes == null) {
    return "";
  }

  if (typeof body.notes !== "string") {
    throw new HttpError(400, "INVALID_INPUT", "notes must be a string.");
  }

  return body.notes.trim();
}

async function findBooking(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found.");
  }

  const booking = await RentalOrder.findById(id);

  if (!booking) {
    throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found.");
  }

  return booking;
}

async function createNewApiBooking(body, car) {
  const pickupAt = new Date();
  const expectedReturnAt = calculateExpectedReturnAt(pickupAt, body.rentalDays);
  const totalAmount = calculateEstimatedAmount(body.rentalDays, car.dailyRate);
  const order = new RentalOrder({
    username: body.username,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    plateNo: car.plateNo,
    carModel: car.model,
    dailyRate: car.dailyRate,
    pickupAt,
    rentalDays: body.rentalDays,
    expectedReturnAt,
    totalAmount,
    status: "active",
    notes: body.notes,
  });

  return order.save();
}

module.exports = {
  list: asyncHandler(async (req, res) => {
    const bookings = await RentalOrder.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json(bookings);
  }),

  create: asyncHandler(async (req, res) => {
    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const username = requiredText(body, "username");

    if (!USERNAMES.has(username)) {
      throw new HttpError(400, "USER_NOT_FOUND", "The username is not a preset account.");
    }

    const customerName = requiredText(body, "customerName");
    const customerPhone = requiredText(body, "customerPhone");
    const plateNo = requiredText(body, "plateNo");
    const rentalDays = readRentalDays(body.rentalDays);
    const notes = readNotes(body);
    const car = await Car.findOne({ plateNo }).lean();

    if (!car) {
      throw new HttpError(400, "CAR_NOT_FOUND", "The selected car does not exist.");
    }

    const activeOrder = await RentalOrder.findOne({ plateNo, status: "active" })
      .select("_id")
      .lean();

    if (activeOrder) {
      throw new HttpError(
        409,
        "CAR_UNAVAILABLE",
        "The selected car already has an active booking.",
      );
    }

    const booking = await createNewApiBooking(
      {
        username,
        customerName,
        customerPhone,
        rentalDays,
        notes,
      },
      car,
    );

    return res.status(201).json(booking);
  }),

  update: asyncHandler(async (req, res) => {
    const booking = await findBooking(req.params.id);
    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const now = new Date();

    if (booking.status !== "active" || isOverdue(booking, now)) {
      throw new HttpError(
        409,
        "BOOKING_STATE_CONFLICT",
        "Only active, non-overdue bookings can be changed.",
      );
    }

    const rentalDays = readRentalDays(body.rentalDays);
    const expectedReturnAt = calculateExpectedReturnAt(booking.pickupAt, rentalDays);

    if (expectedReturnAt.getTime() <= now.getTime()) {
      throw new HttpError(
        400,
        "RETURN_TIME_NOT_IN_FUTURE",
        "The new expected return time must be in the future.",
      );
    }

    booking.rentalDays = rentalDays;
    booking.expectedReturnAt = expectedReturnAt;
    booking.totalAmount = calculateEstimatedAmount(rentalDays, booking.dailyRate);
    await booking.save();

    return res.status(200).json(booking);
  }),

  remove: asyncHandler(async (req, res) => {
    const booking = await findBooking(req.params.id);

    if (booking.status !== "completed") {
      throw new HttpError(
        409,
        "BOOKING_STATE_CONFLICT",
        "Only completed bookings can be deleted.",
      );
    }

    const id = String(booking._id);
    await booking.deleteOne();

    return res.status(200).json({
      message: "Booking deleted.",
      id,
    });
  }),
};
