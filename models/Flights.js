const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: [true, "Flight number is required"],
    trim: true
  },
  airline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Airline",
    required: [true, "Airline is required"]
  },
  departure: {
    type: String,
    required: [true, "Departure airport is required"],
    uppercase: true,
    trim: true
  },
  destination: {
    type: String,
    required: [true, "Destination airport is required"],
    uppercase: true,
    trim: true
  },
  departureDate: {
    type: Date,
    required: [true, "Departure date is required"]
  },
  arrivalDate: {
    type: Date,
    required: [true, "Arrival date is required"]
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: 0
  },
  ecoSeatsAvailable: {
    type: Number,
    required: [true, "Economy seat inventory is required"],
    min: 0
  },
  busSeatsAvailable: {
    type: Number,
    required: [true, "Business seat inventory is required"],
    min: 0
  },
  isDirect: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ["Scheduled", "Delayed", "Cancelled"],
    default: "Scheduled"
  }
}, { timestamps: true });

module.exports = mongoose.model("Flight", flightSchema);
