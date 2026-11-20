# FleetDesk Car Rental System (Course Demo)

> **DEMO ONLY.** This repository is a COMP3810SEF Group 36 course project used for coursework demonstration. It is not production software. The preset demo accounts and fixed cookie-session secret are included for demonstration only.

FleetDesk is a customer-facing car rental web application for COMP3810SEF Group 36. It uses Express, EJS, MongoDB, Mongoose, and cookie-session. Customers can browse specific vehicles, create immediate rentals, update rental days, return a car, and delete completed booking history.

## Group Information

| Member | Student ID | Main role |
|---|---|---|
| Yuan Chong Jun | 13705584 | Express entry point, MongoDB connection, Git integration, README, ZIP, presentation control |
| Huang Wei Jia | 13686319 | MongoDB models, fixed accounts, Login/Logout, authentication middleware, seed data |
| Tan Yuan Ting | 13374348 | EJS pages, forms, vehicle images, CSS, responsive layout |
| Liu Jia Hao | 13662451 | Vehicle queries, Web CRUD, rental rules, amount calculation, Return now |
| Hu Qing Kai | 13661454 | REST API, CURL commands, testing, QA, rehearsal timing |

## Project Scope

- Customer login with two preset accounts
- Individual vehicle cards with local images
- Category and availability filters
- Immediate rental start with a 1–30 day duration
- Active and completed booking lifecycle
- Overdue display based on `expectedReturnAt`
- Four REST CRUD endpoints for bookings
- Controller check that prevents a second active booking for the same car

The project does not include registration, payments, deposits, licensing documents, image upload, a staff dashboard, future-date reservations, or an AI feature.

## Demo Accounts

| Username | Password |
|---|---|
| `customer01` | `demo123` |
| `customer02` | `demo123` |

The fixed accounts are stored on the server in `config/users.js`. They are not stored in MongoDB and `seed.js` must not create account records.

## Technology

- Node.js 20 or later
- Express
- EJS
- MongoDB Atlas
- Mongoose
- cookie-session

## Implementation Status

The customer-facing application workflow is implemented in this repository.

Implemented:

- Car and RentalOrder schemas with basic Mongoose validation
- Seven seed records recreated with `deleteMany()` and `Model.save()`
- Fixed-account login, Logout, and cookie-session page protection
- Dynamic vehicle availability with category and status filters
- Booking creation, rental-day updates, Return now, and completed-history deletion
- Four REST booking operations with documented JSON error responses
- Automated tests for business rules, schemas, seed data, login, route protection, and API error handling

## Setup

From the project root:

```bash
npm install
```

Open `config/db.js` and paste your MongoDB Atlas connection string into:

```javascript
const MONGODB_URI = "";
```

The project does not use a `.env` file for the database URL, port, or session secret.
The local port and cookie-session secret are declared near the top of `server.js`.

```javascript
const PORT = 8099;
const SESSION_SECRET = "fleetdesk-group36-course-session-secret";
```

After filling in the MongoDB URI, run:

```bash
node seed.js
npm start
```

Open <http://localhost:8099>.

Do not commit a real MongoDB Atlas connection string when sharing a public copy of the project.

## Commands

```bash
npm start   # start the web application
node seed.js # delete old cars and insert the seven demo cars
npm test    # run business-rule, schema, login, and route tests
```

`seed.js` clears the current `cars` collection, saves the seven demo cars again, and does not create rental orders.

## Web Routes

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/login` | Show login page and authenticate a preset customer |
| GET | `/logout` | Clear the session and return to login |
| GET | `/cars` | Browse and filter cars |
| GET | `/cars/:plateNo` | Show one car and Rent now entry |
| GET | `/bookings` | Show the signed-in customer’s bookings |
| GET/POST | `/bookings/new/:plateNo` | Show and submit the booking form |
| GET | `/bookings/:id` | Show booking details |
| GET | `/bookings/:id/edit` | Show the rental-days form |
| POST | `/bookings/:id/update` | Save a new rental duration |
| POST | `/bookings/:id/return` | Return the car now and complete the booking |
| POST | `/bookings/:id/delete` | Delete a completed booking |

## REST API

The API is intentionally open for course demonstration and does not use session authentication.

| Method | Path | Success | Main failures |
|---|---|---|---|
| GET | `/api/bookings` | `200` | `500` |
| POST | `/api/bookings` | `201` | `400`, `409`, `500` |
| PUT | `/api/bookings/:id` | `200` | `400`, `404`, `409`, `500` |
| DELETE | `/api/bookings/:id` | `200` | `404`, `409`, `500` |

POST body:

```json
{
  "username": "customer01",
  "customerName": "Chan Tai Man",
  "customerPhone": "91234567",
  "plateNo": "HK-SUV-01",
  "rentalDays": 3,
  "notes": "API demo"
}
```

PUT body:

```json
{
  "rentalDays": 2
}
```

### CURL Examples

Set the base URL first:

```bash
BASE_URL="http://localhost:8099"
```

List bookings:

```bash
curl -i "$BASE_URL/api/bookings"
```

Create a booking:

```bash
curl -i -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer01",
    "customerName": "Chan Tai Man",
    "customerPhone": "91234567",
    "plateNo": "HK-SUV-01",
    "rentalDays": 3,
    "notes": "API demo"
  }'
```

Update rental days:

```bash
BOOKING_ID="PASTE_ACTIVE_BOOKING_ID"

curl -i -X PUT "$BASE_URL/api/bookings/$BOOKING_ID" \
  -H "Content-Type: application/json" \
  -d '{"rentalDays": 2}'
```

Delete a completed booking:

```bash
COMPLETED_ID="PASTE_COMPLETED_BOOKING_ID"

curl -i -X DELETE "$BASE_URL/api/bookings/$COMPLETED_ID"
```

## Directory Structure

```text
.
|-- .github/                Pull request template
|-- config/
|   |-- db.js               MongoDB URL and connection helper
|   `-- users.js            Fixed customer accounts
|-- controllers/            Web and REST request handlers
|-- data/cars.js            Seven seed vehicle records
|-- lib/                    Shared business rules and category definitions
|-- middleware/             requireAuth middleware
|-- models/                 Car and RentalOrder schemas
|-- public/css/             Application styling
|-- public/images/cars/     Seven local vehicle images and fallback image
|-- routes/                 Express route definitions
|-- test/                   Automated Node.js tests
|-- utils/                  HTTP error and async wrappers
|-- views/                  EJS pages and partials
|-- seed.js                 Vehicle seed entry point
|-- server.js               Express application entry point
```

## Data Model

### Car

Each document stores a unique `plateNo`, category, transmission, seats, daily rate, description, and a local `imagePath`.

### RentalOrder

Each document stores the customer, vehicle and price snapshots, pickup time, rental days, expected return time, amount, and status. Return-time fields are added when the booking becomes `completed`.

Money is stored in HKD. Dates are stored as BSON `Date` values. `overdue` is derived for display and is not stored as a `status`.

## Business Rules

- A booking starts immediately.
- Rental duration is an integer from 1 to 30 days.
- `expectedReturnAt = pickupAt + rentalDays × 24 hours`.
- The active amount is `rentalDays × dailyRate`.
- Return billing uses `actualDays = max(1, ceil(elapsed / 24 hours))`.
- Any partial day counts as one full day.
- Each overdue day adds one additional full daily charge.
- Only active, non-overdue bookings may change duration.
- Completed bookings cannot change amount or duration.
- Only completed bookings may be deleted.

## Database Indexes

- Unique `cars.plateNo`
- No custom `RentalOrder` indexes; the one-active-booking rule is enforced in the controller.

## Submission Package

For final submission, copy the project into a folder named `comp3810sef_group36`, remove `node_modules`, and create `comp3810sef_group36.zip`.

```text
comp3810sef_group36/
comp3810sef_group36.zip
```

Before submission, confirm that the project starts from a clean directory using the README commands.
