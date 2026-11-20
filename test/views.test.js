const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const ejs = require("ejs");
const { isOverdue } = require("../lib/rental-rules");

const viewsRoot = path.join(__dirname, "..", "views");
const now = new Date("2026-11-18T02:00:00.000Z");
const currentUser = {
  username: "customer01",
  customerName: "Chan Tai Man",
  customerPhone: "91234567",
};
const car = {
  plateNo: "HK-SUV-01",
  brand: "Mercedes-AMG",
  model: "G 63",
  category: "SUV",
  transmission: "Automatic",
  seats: 5,
  dailyRate: 4800,
  description: "Luxury SUV.",
  imagePath: "/images/cars/benz_g63.avif",
  availability: "Available",
};
const booking = {
  id: "6740a4c8f1b2c3d4e5f60718",
  username: "customer01",
  customerName: "Chan Tai Man",
  customerPhone: "91234567",
  plateNo: "HK-SUV-01",
  carModel: "G 63",
  dailyRate: 4800,
  pickupAt: new Date("2026-11-17T02:00:00.000Z"),
  rentalDays: 3,
  expectedReturnAt: new Date("2026-11-20T02:00:00.000Z"),
  totalAmount: 14400,
  status: "active",
  notes: "Test booking",
  createdAt: new Date("2026-11-17T02:00:00.000Z"),
};

function baseLocals(title) {
  return {
    title,
    currentUser,
    currentPath: "/",
    flashNotice: "",
    flashError: "",
    now,
    money: (amount) => Number(amount).toFixed(2),
    dateTime: (value) => new Date(value).toISOString(),
    isOverdue,
  };
}

function renderView(relativePath, locals) {
  return ejs.renderFile(path.join(viewsRoot, relativePath), locals);
}

test("login view renders both preset demo accounts", async () => {
  const html = await renderView("login.ejs", {
    ...baseLocals("Customer Login"),
    currentUser: null,
    error: "Incorrect username or password.",
    username: "customer01",
  });

  assert.match(html, /customer01 \/ demo123/);
  assert.match(html, /customer02 \/ demo123/);
  assert.match(html, /Incorrect username or password/);
});

test("car list and detail views render vehicle-specific data", async () => {
  const listHtml = await renderView("cars/index.ejs", {
    ...baseLocals("Browse Cars"),
    cars: [car],
    categories: ["SUV", "Sedan", "MPV", "Sport Car"],
    selectedCategory: "SUV",
    selectedAvailability: "Available",
  });
  const detailHtml = await renderView("cars/show.ejs", {
    ...baseLocals("Mercedes-AMG G 63"),
    car,
  });

  for (const html of [listHtml, detailHtml]) {
    assert.match(html, /Mercedes-AMG G 63/);
    assert.match(html, /HK-SUV-01/);
    assert.match(html, /\/images\/cars\/benz_g63\.avif/);
  }

  assert.match(detailHtml, /Rent now/);
});

test("booking list and detail views render status, time, and HKD amount", async () => {
  const listHtml = await renderView("bookings/index.ejs", {
    ...baseLocals("My Bookings"),
    currentPath: "/bookings",
    bookings: [booking],
  });
  const detailHtml = await renderView("bookings/show.ejs", {
    ...baseLocals("Booking Details"),
    currentPath: "/bookings",
    booking,
    overdue: false,
  });

  for (const html of [listHtml, detailHtml]) {
    assert.match(html, /6740a4c8f1b2c3d4e5f60718/);
    assert.match(html, /HKD 14400\.00/);
    assert.match(html, /active/);
  }

  assert.match(detailHtml, /Return now/);
  assert.match(detailHtml, /Change rental days/);
});

test("booking new and edit forms retain valid ranges and error messages", async () => {
  const newHtml = await renderView("bookings/new.ejs", {
    ...baseLocals("Create Booking"),
    currentPath: "/bookings",
    car,
    form: { rentalDays: "3", notes: "Airport pickup" },
    error: "This car has just been rented.",
  });
  const editHtml = await renderView("bookings/edit.ejs", {
    ...baseLocals("Change Rental Days"),
    currentPath: "/bookings",
    booking,
    form: { rentalDays: "2" },
    error: null,
  });

  assert.match(newHtml, /min="1" max="30"/);
  assert.match(newHtml, /This car has just been rented/);
  assert.match(editHtml, /value="2"/);
});
