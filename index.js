const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const { errorHandler } = require("./auth");
const userRoutes = require("./routes/user");
const flightRoutes = require("./routes/flights");
const airlineRoutes = require("./routes/airline");
const bookingRoutes = require("./routes/booking");
const paymentRoutes = require("./routes/payment");

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(Object.assign(new Error("Origin is not allowed by CORS"), { status: 403 }));
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/users", userRoutes);
app.use("/flights", flightRoutes);
app.use("/airlines", airlineRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});
app.use(errorHandler);

async function connectDatabase() {
  if (!process.env.MONGODB_STRING) {
    throw new Error("MONGODB_STRING is required in server/.env");
  }
  if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET_KEY is required in server/.env");
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_STRING);
  }
  return mongoose.connection;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 4000;
  connectDatabase()
    .then(() => {
      app.listen(port, () => console.log(`API running at http://localhost:${port}`));
    })
    .catch((error) => {
      console.error(`Unable to start API: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { app, mongoose, connectDatabase };
