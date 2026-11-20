const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");

const { app } = require("../server");
const { CARS } = require("../data/cars");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("health endpoint returns JSON without a database query", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("all seeded car images are served by the Express static middleware", async () => {
  for (const car of CARS) {
    const response = await fetch(`${baseUrl}${encodeURI(car.imagePath)}`);
    assert.equal(response.status, 200, car.imagePath);
    assert.match(response.headers.get("content-type"), /^image\//);
  }
});

test("unauthenticated protected pages redirect to login", async () => {
  const response = await fetch(`${baseUrl}/cars`, { redirect: "manual" });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/login");
});

test("correct preset credentials create a session and redirect to cars", async () => {
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username: "customer01",
      password: "demo123",
    }),
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/cars");
  assert.match(response.headers.get("set-cookie"), /loginSession=/);
});

test("incorrect credentials keep the customer on the login page", async () => {
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username: "customer01",
      password: "wrong",
    }),
  });
  const html = await response.text();

  assert.equal(response.status, 401);
  assert.match(html, /The username or password is incorrect/);
});

test("API validation errors use the documented JSON error shape", async () => {
  const invalidUsernameResponse = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "unknown",
      customerName: "Test User",
      customerPhone: "90000000",
      plateNo: "HK-SUV-01",
      rentalDays: 2,
    }),
  });
  const invalidUsernameBody = await invalidUsernameResponse.json();

  assert.equal(invalidUsernameResponse.status, 400);
  assert.equal(invalidUsernameBody.error.code, "USER_NOT_FOUND");
  assert.equal(typeof invalidUsernameBody.error.message, "string");

  const invalidIdResponse = await fetch(`${baseUrl}/api/bookings/not-an-id`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rentalDays: 2 }),
  });
  const invalidIdBody = await invalidIdResponse.json();

  assert.equal(invalidIdResponse.status, 404);
  assert.equal(invalidIdBody.error.code, "BOOKING_NOT_FOUND");
});

test("malformed JSON returns a JSON INVALID_INPUT response", async () => {
  const response = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_INPUT");
});

test("unknown API routes return JSON instead of the login page", async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "BOOKING_NOT_FOUND");
});
