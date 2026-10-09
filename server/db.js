const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://jazeel5:Admin@cluster0.oud0fml.mongodb.net/ejamaat";

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("MongoDB connected successfully");
    isConnecting = false;
  } catch (err) {
    isConnecting = false;
    console.error("Failed to connect to MongoDB:", err.message || err);
    console.log("Will retry MongoDB connection in 5 seconds...");
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

// Reconnect automatically if connection drops
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
  setTimeout(() => {
    connectDB();
  }, 3000);
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message || err);
});

module.exports = connectDB;
