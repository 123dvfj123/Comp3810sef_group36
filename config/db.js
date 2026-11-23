const mongoose = require("mongoose");

const MONGODB_URI =
  "mongodb+srv://hwj914_db_user:20060914Hwj@cluster0.gu1aovf.mongodb.net/";

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
