const mongoose = require("mongoose");

const Car = require("../models/Car");
const RentalOrder = require("../models/RentalOrder");
const asyncHandler = require("../utils/async-handler");
const HttpError = require("../utils/http-error");
const {
  calculateEstimatedAmount,
  calculateExpectedReturnAt,
  calculateReturnTotals,
  isOverdue,
  isValidRentalDays,
} = require("../lib/rental-rules");

async function saveNewRental(user, car, rentalDays, notes) {
  const pickupAt = new Date();
  const expectedReturnAt = calculateExpectedReturnAt(pickupAt, rentalDays);
  const totalAmount = calculateEstimatedAmount(rentalDays, car.dailyRate);
  const order = new RentalOrder({
    username: user.username,
    customerName: user.customerName,
    customerPhone: user.customerPhone,
    plateNo: car.plateNo,
    carModel: car.model,
    dailyRate: car.dailyRate,
    pickupAt,
    rentalDays,
    expectedReturnAt,
    totalAmount,
    status: "active",
    notes,
  });

  return order.save();
}

function parseWebRentalDays(value) {
  const rawValue = String(value || "").trim();

  if (!/^\d+$/.test(rawValue)) {
    return null;
  }

  const rentalDays = Number(rawValue);
  return isValidRentalDays(rentalDays) ? rentalDays : null;
}

function webNotes(value) {
  return String(value || "").trim();
}

async function findOwnedBooking(id, username) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found.");
  }

  const booking = await RentalOrder.findOne({ _id: id, username });

  if (!booking) {
    throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found.");
  }

  return booking;
}

const index = asyncHandler(async (req, res) => {
  const bookings = await RentalOrder.find({ username: req.session.user.username })
    .sort({ createdAt: -1 })
    .lean();
  const bookingList = bookings.map((booking) => ({
    ...booking,
    id: String(booking._id),
  }));

  return res.status(200).render("bookings/index", {
    title: "My Bookings",
    bookings: bookingList,
  });
});

const showNew = asyncHandler(async (req, res) => {
  const plateNo = String(req.params.plateNo || "").trim();
  const [car, activeOrder] = await Promise.all([
    Car.findOne({ plateNo }).lean(),
    RentalOrder.findOne({ plateNo, status: "active" }).select("_id").lean(),
  ]);

  if (!car) {
    throw new HttpError(404, "CAR_NOT_FOUND", "The requested car does not exist.");
  }

  if (activeOrder) {
    throw new HttpError(
      409,
      "CAR_UNAVAILABLE",
      "This car is currently rented and cannot start a new booking.",
    );
  }

  return res.status(200).render("bookings/new", {
    title: "Create Booking",
    car,
    form: {
      rentalDays: "1",
      notes: "",
    },
    error: null,
  });
});

const create = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const plateNo = String(req.params.plateNo || "").trim();
  const rentalDays = parseWebRentalDays(body.rentalDays);
  const notes = webNotes(body.notes);
  const car = await Car.findOne({ plateNo }).lean();

  if (!car) {
    throw new HttpError(404, "CAR_NOT_FOUND", "The requested car does not exist.");
  }

  if (rentalDays == null) {
    return res.status(400).render("bookings/new", {
      title: "Create Booking",
      car,
      form: {
        rentalDays: String(body.rentalDays || ""),
        notes,
      },
      error: "Rental days must be an integer from 1 to 30.",
    });
  }

  const activeOrder = await RentalOrder.findOne({ plateNo, status: "active" })
    .select("_id")
    .lean();

  if (activeOrder) {
    return res.status(409).render("bookings/new", {
      title: "Create Booking",
      car,
      form: {
        rentalDays: String(rentalDays),
        notes,
      },
      error: "This car has just been rented. Please choose another vehicle.",
    });
  }

  const booking = await saveNewRental(req.session.user, car, rentalDays, notes);
  return res.redirect(`/bookings/${booking.id}`);
});

const show = asyncHandler(async (req, res) => {
  const booking = await findOwnedBooking(req.params.id, req.session.user.username);

  return res.status(200).render("bookings/show", {
    title: "Booking Details",
    booking,
    overdue: isOverdue(booking, new Date()),
  });
});

const showEdit = asyncHandler(async (req, res) => {
  const booking = await findOwnedBooking(req.params.id, req.session.user.username);
  const now = new Date();

  if (booking.status !== "active" || isOverdue(booking, now)) {
    throw new HttpError(
      409,
      "BOOKING_STATE_CONFLICT",
      "Only active, non-overdue bookings can be changed. Use Return now instead.",
    );
  }

  return res.status(200).render("bookings/edit", {
    title: "Change Rental Days",
    booking,
    form: {
      rentalDays: String(booking.rentalDays),
    },
    error: null,
  });
});

const update = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const booking = await findOwnedBooking(req.params.id, req.session.user.username);
  const rentalDays = parseWebRentalDays(body.rentalDays);
  const now = new Date();

  if (booking.status !== "active" || isOverdue(booking, now)) {
    throw new HttpError(
      409,
      "BOOKING_STATE_CONFLICT",
      "Only active, non-overdue bookings can be changed. Use Return now instead.",
    );
  }

  if (rentalDays == null) {
    return res.status(400).render("bookings/edit", {
      title: "Change Rental Days",
      booking,
      form: {
        rentalDays: String(body.rentalDays || ""),
      },
      error: "Rental days must be an integer from 1 to 30.",
    });
  }

  const expectedReturnAt = calculateExpectedReturnAt(booking.pickupAt, rentalDays);

  if (expectedReturnAt.getTime() <= now.getTime()) {
    return res.status(400).render("bookings/edit", {
      title: "Change Rental Days",
      booking,
      form: {
        rentalDays: String(rentalDays),
      },
      error: "The new expected return time is not in the future. Use Return now instead.",
    });
  }

  booking.rentalDays = rentalDays;
  booking.expectedReturnAt = expectedReturnAt;
  booking.totalAmount = calculateEstimatedAmount(rentalDays, booking.dailyRate);
  await booking.save();

  return res.redirect(`/bookings/${booking.id}`);
});

const returnNow = asyncHandler(async (req, res) => {
  const booking = await findOwnedBooking(req.params.id, req.session.user.username);

  if (booking.status !== "active") {
    throw new HttpError(
      409,
      "BOOKING_STATE_CONFLICT",
      "This booking has already been completed.",
    );
  }

  const actualReturnAt = new Date();
  const totals = calculateReturnTotals(
    booking.pickupAt,
    actualReturnAt,
    booking.rentalDays,
    booking.dailyRate,
  );

  if (
    totals.actualDays == null ||
    totals.overdueDays == null ||
    totals.billableDays == null
  ) {
    throw new HttpError(500, "INTERNAL_ERROR", "Return totals could not be calculated.");
  }

  Object.assign(booking, totals, {
    actualReturnAt,
    status: "completed",
  });
  await booking.save();

  return res.redirect(`/bookings/${booking.id}`);
});

const remove = asyncHandler(async (req, res) => {
  const booking = await findOwnedBooking(req.params.id, req.session.user.username);

  if (booking.status !== "completed") {
    throw new HttpError(
      409,
      "BOOKING_STATE_CONFLICT",
      "Only completed bookings can be deleted.",
    );
  }

  await booking.deleteOne();
  return res.redirect("/bookings");
});

module.exports = {
  index,
  showNew,
  create,
  show,
  showEdit,
  update,
  returnNow,
  remove,
};
