# FleetDesk Car Rental System

FleetDesk is a customer-facing car rental web application built with Express, EJS, MongoDB, Mongoose, and cookie-session. Customers can browse specific vehicles, create immediate rentals, update rental days, return a car, and delete completed booking history.

Vehicle records are provided by an externally managed MongoDB database. This repository contains no local vehicle data and no seed module.

## Group Information

Group 36

| Member | Student ID | Work role |
|---|---|---|
| Yuan Chong Jun | 13705584 | Express entry point, MongoDB connection, Git integration, README, ZIP packaging, presentation control |
| Huang Wei Jia | 13686319 | MongoDB models, account configuration, Login/Logout, authentication middleware, external database integration |
| Tan Yuan Ting | 13374348 | EJS pages, forms, vehicle images, CSS, responsive layout |
| Liu Jia Hao | 13662451 | Vehicle queries, Web CRUD, rental rules, amount calculation, Return now |
| Hu Qing Kai | 13661454 | REST API, CURL testing, QA, presentation preparation |

## Features

- Customer sign-in with accounts configured on the server
- Individual vehicle cards with local images
- Vehicle records read from a pre-populated external MongoDB database
- Category and availability filters
- Immediate rental start with a 1-30 day duration
- Active and completed booking lifecycle
- Overdue display based on `expectedReturnAt`
- Four REST CRUD endpoints for bookings
- Controller check that prevents a second active booking for the same car

The application does not include registration, payments, deposits, licensing documents, image upload, a staff dashboard, future-date reservations, or an AI feature.

## Accounts

Customer accounts are defined in `config/users.js` and are not stored in MongoDB. These are the valid login credentials for the application.

| Username | Password | Customer |
|---|---|---|
| `customer01` | `123456` | Liu Jia Hao |
| `customer02` | `123456` | Huang Wei Jia |

## Technology

- Node.js 20 or later
- Express
- EJS
- MongoDB (externally managed)
- Mongoose
- cookie-session

## Implementation Status

The customer-facing application workflow is implemented in this repository.

Implemented:

- Car and RentalOrder schemas with basic Mongoose validation
- Vehicle records read from an externally managed, pre-populated MongoDB database
- Fixed-account sign-in, Logout, and cookie-session page protection
- Dynamic vehicle availability with category and status filters
- Booking creation, rental-day updates, Return now, and completed-history deletion
- Four REST booking operations with documented JSON error responses

## Setup

The MongoDB connection string is already configured in `config/db.js`, so a fresh clone can run without extra database setup:

```bash
npm install
npm start
```

The external database already contains the `cars` collection and the vehicle records used by the application. This project does not include local vehicle data or a seed command.

The database also provides a unique index on `cars.plateNo`. The application connects with `autoIndex: false`, so it does not create or modify database indexes.

The project does not use a `.env` file. The database URL is declared in `config/db.js`; the local port and cookie-session secret are declared near the top of `server.js`.

```javascript
const PORT = 8099;
const SESSION_SECRET = "fleetdesk-session-signing-key-2026";
```

Change the session secret before deploying to a public server.

The expected startup output is:

```text
FleetDesk started successfully.
Local URL: http://localhost:8099
```
## Commands

```bash
npm start   # start the web application
```

Vehicle records are read from the externally managed `cars` collection. The application does not create or seed base vehicle data.

## Operation Guide

### Sign in and sign out

1. Open `http://localhost:8099/login`.
2. Enter `customer01` with password `123456`, or `customer02` with password `123456`.
3. Press **Enter FleetDesk**.
4. Press **Logout** in the top navigation to end the session.

### Web CRUD pages

| Operation | Page | Action |
|---|---|---|
| Read | `/cars` | Filter by category or availability, then open a vehicle |
| Create | `/cars/:plateNo` | Press **Rent now**, choose 1-30 days, and submit the form |
| Read | `/bookings` | Open **My bookings** and select a booking |
| Update | `/bookings/:id` | Press **Change rental days** and save the new duration |
| Update | `/bookings/:id` | Press **Return now** to complete the rental |
| Delete | `/bookings/:id` | Press **Delete completed booking** on a completed booking |

### RESTful services

The four `/api/bookings` endpoints, their HTTP methods, paths and CURL commands are listed in [REST API](#rest-api) and [CURL Examples](#curl-examples).

## Web Routes

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/login` | Show the sign-in page and authenticate a configured customer |
| GET | `/logout` | Clear the session and return to sign-in |
| GET | `/cars` | Browse and filter cars |
| GET | `/cars/:plateNo` | Show one car and the Rent now entry |
| GET | `/bookings` | Show the signed-in customer's bookings |
| GET/POST | `/bookings/new/:plateNo` | Show and submit the booking form |
| GET | `/bookings/:id` | Show booking details |
| GET | `/bookings/:id/edit` | Show the rental-days form |
| POST | `/bookings/:id/update` | Save a new rental duration |
| POST | `/bookings/:id/return` | Return the car now and complete the booking |
| POST | `/bookings/:id/delete` | Delete a completed booking |

## REST API

The REST API does not use session authentication. Access control should be added before exposing it publicly.

| Method | Path | Success | Main failures |
|---|---|---|---|
| GET | `/api/bookings` | `200` | `500` |
| POST | `/api/bookings` | `201` | `400`, `409`, `500` |
| PUT | `/api/bookings/:id` | `200` | `400`, `404`, `409`, `500` |
| DELETE | `/api/bookings/:id` | `200` | `404`, `409`, `500` |

`plateNo` must be an existing car taken from the Cars page, and the car must not have an active booking.

POST body:

```json
{
  "username": "customer01",
  "customerName": "Chan Tai Man",
  "customerPhone": "91234567",
  "plateNo": "REPLACE-WITH-PLATE",
  "rentalDays": 3,
  "notes": "API request"
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
    "plateNo": "REPLACE-WITH-PLATE",
    "rentalDays": 3,
    "notes": "API request"
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

## Project Files

```text
.
|-- config/
|   |-- db.js               MongoDB URL and connection helper
|   `-- users.js            Customer accounts
|-- controllers/            Web and REST request handlers
|-- middleware/             Auth guard, async route wrapper and HTTP error helper
|-- models/                 Car and RentalOrder schemas, category enum and rental rules
|-- public/css/             Application styling
|-- public/images/cars/     7 vehicle images and 1 placeholder image
|-- routes/                 Express route definitions
|-- views/                  EJS pages and partials
|-- server.js               Express application entry point
```

- `server.js`: Express entry point, middleware, route mounting and startup messages.
- `package.json`: dependency list and the `npm start` command.
- `public/`: application CSS and vehicle images used by the pages.
- `views/`: EJS pages and shared partials for sign-in, cars and bookings.
- `models/`: `Car` and `RentalOrder` schemas plus the rental rules.
- `controllers/`: web and REST request handlers.
- `routes/`: Express route definitions.
- `middleware/`: authentication guard and HTTP error helpers.
- `config/`: MongoDB connection helper and customer accounts.

## Data Model

### Car

Vehicle documents are provisioned externally. Each document stores a unique `plateNo`, category, transmission, seats, daily rate, description, and a local `imagePath`. The path must match one of the bundled `/images/cars/...` assets.

### RentalOrder

Each document stores the customer, vehicle and price snapshots, pickup time, rental days, expected return time, amount, and status. Return-time fields are added when the booking becomes `completed`.

Money is stored in HKD. Dates are stored as BSON `Date` values. `overdue` is derived for display and is not stored as a `status`.

## Business Rules

- A booking starts immediately.
- Rental duration is an integer from 1 to 30 days.
- `expectedReturnAt = pickupAt + rentalDays x 24 hours`.
- The active amount is `rentalDays x dailyRate`.
- Return billing uses `actualDays = max(1, ceil(elapsed / 24 hours))`.
- Any partial day counts as one full day.
- Each overdue day adds one additional full daily charge.
- Only active, non-overdue bookings may change duration.
- Completed bookings cannot change amount or duration.
- Only completed bookings may be deleted.

## Database Ownership

The MongoDB database is provisioned and maintained outside this application.

- `cars` must already contain vehicle records before the application starts.
- `cars.plateNo` must have a unique index.
- Database schema, data, backups, and indexes are owned by the external database administrator.
- The application does not include a seed script, local vehicle arrays, or automatic index creation.
