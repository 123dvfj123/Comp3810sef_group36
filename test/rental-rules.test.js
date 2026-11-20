const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateEstimatedAmount,
  calculateExpectedReturnAt,
  calculateReturnTotals,
  isOverdue,
  isValidRentalDays,
} = require("../lib/rental-rules");

const DAY_MS = 24 * 60 * 60 * 1000;
const PICKUP_AT = new Date("2026-11-18T02:00:00.000Z");

test("calculates the expected return time using 24-hour rental days", () => {
  assert.equal(
    calculateExpectedReturnAt(PICKUP_AT, 3).toISOString(),
    "2026-11-21T02:00:00.000Z",
  );
});

test("calculates the active-stage estimated amount to two decimal places", () => {
  assert.equal(calculateEstimatedAmount(3, 680.129), 2040.39);
});

test("charges each overdue day again according to the documented formula", () => {
  const totals = calculateReturnTotals(
    PICKUP_AT,
    new Date(PICKUP_AT.getTime() + 4 * DAY_MS),
    3,
    680,
  );

  assert.deepEqual(totals, {
    actualDays: 4,
    overdueDays: 1,
    billableDays: 5,
    totalAmount: 3400,
  });
});

test("rounds a partial day up to one full day", () => {
  const totals = calculateReturnTotals(
    PICKUP_AT,
    new Date(PICKUP_AT.getTime() + 2.5 * DAY_MS),
    3,
    680,
  );

  assert.deepEqual(totals, {
    actualDays: 3,
    overdueDays: 0,
    billableDays: 3,
    totalAmount: 2040,
  });
});

test("bills at least one day for a very short rental", () => {
  const totals = calculateReturnTotals(
    PICKUP_AT,
    new Date(PICKUP_AT.getTime() + 12 * 60 * 60 * 1000),
    1,
    680,
  );

  assert.deepEqual(totals, {
    actualDays: 1,
    overdueDays: 0,
    billableDays: 1,
    totalAmount: 680,
  });
});

test("marks only active orders as overdue after their expected return time", () => {
  const expectedReturnAt = new Date(PICKUP_AT.getTime() + 2 * DAY_MS);
  const order = { status: "active", expectedReturnAt };

  assert.equal(isOverdue(order, expectedReturnAt), false);
  assert.equal(isOverdue(order, new Date(expectedReturnAt.getTime() + 1)), true);
  assert.equal(
    isOverdue({ ...order, status: "completed" }, new Date(expectedReturnAt.getTime() + DAY_MS)),
    false,
  );
});

test("accepts only integer rental lengths from 1 through 30", () => {
  assert.equal(isValidRentalDays(1), true);
  assert.equal(isValidRentalDays(30), true);
  assert.equal(isValidRentalDays(0), false);
  assert.equal(isValidRentalDays(31), false);
  assert.equal(isValidRentalDays(2.5), false);
});
