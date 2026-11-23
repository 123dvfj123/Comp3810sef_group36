const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = HOURS_PER_DAY * MILLISECONDS_PER_HOUR;

function toDate(value, fieldName) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`${fieldName} must be a valid date.`);
  }

  return date;
}

function isValidRentalDays(rentalDays) {
  return Number.isInteger(rentalDays) && rentalDays >= 1 && rentalDays <= 30;
}

function assertRentalDays(rentalDays) {
  if (!isValidRentalDays(rentalDays)) {
    throw new RangeError("rentalDays must be an integer from 1 to 30.");
  }
}

function assertDailyRate(dailyRate) {
  if (typeof dailyRate !== "number" || !Number.isFinite(dailyRate) || dailyRate <= 0) {
    throw new RangeError("dailyRate must be a number greater than 0.");
  }
}

function roundMoney(amount) {
  return Number(amount.toFixed(2));
}

function calculateExpectedReturnAt(pickupAt, rentalDays) {
  assertRentalDays(rentalDays);
  const pickupDate = toDate(pickupAt, "pickupAt");

  return new Date(pickupDate.getTime() + rentalDays * MILLISECONDS_PER_DAY);
}

function calculateEstimatedAmount(rentalDays, dailyRate) {
  assertRentalDays(rentalDays);
  assertDailyRate(dailyRate);

  return roundMoney(rentalDays * dailyRate);
}

function calculateReturnTotals(pickupAt, actualReturnAt, rentalDays, dailyRate) {
  assertRentalDays(rentalDays);
  assertDailyRate(dailyRate);

  const pickupDate = toDate(pickupAt, "pickupAt");
  const returnDate = toDate(actualReturnAt, "actualReturnAt");
  const elapsedMilliseconds = returnDate.getTime() - pickupDate.getTime();

  if (elapsedMilliseconds < 0) {
    throw new RangeError("actualReturnAt must not be earlier than pickupAt.");
  }

  const actualDays = Math.max(1, Math.ceil(elapsedMilliseconds / MILLISECONDS_PER_DAY));
  const overdueDays = Math.max(0, actualDays - rentalDays);
  const billableDays = actualDays + overdueDays;

  return {
    actualDays,
    overdueDays,
    billableDays,
    totalAmount: roundMoney(billableDays * dailyRate),
  };
}

function isOverdue(order, now = new Date()) {
  if (!order || order.status !== "active") {
    return false;
  }

  return toDate(now, "now").getTime() > toDate(order.expectedReturnAt, "expectedReturnAt").getTime();
}

module.exports = {
  calculateExpectedReturnAt,
  calculateEstimatedAmount,
  calculateReturnTotals,
  isOverdue,
  isValidRentalDays,
};
