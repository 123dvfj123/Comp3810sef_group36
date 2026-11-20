const mongoose = require("mongoose");

// Paste your MongoDB Atlas connection string between the quotation marks.
const MONGODB_URI = "";

async function connectDatabase() {
  if (!MONGODB_URI) {
    throw new Error("Please fill in MONGODB_URI in config/db.js.");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");
}

module.exports = { MONGODB_URI, connectDatabase };
