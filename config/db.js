const mongoose = require("mongoose");

// The MongoDB database is managed externally.
// Paste the connection string supplied by the database administrator.
const MONGODB_URI = "";

async function connectDatabase() {
  if (!MONGODB_URI) {
    throw new Error("Please fill in MONGODB_URI in config/db.js.");
  }

  await mongoose.connect(MONGODB_URI, {
    autoIndex: false,
  });
  console.log("Connected to external MongoDB.");
}

module.exports = { MONGODB_URI, connectDatabase };
