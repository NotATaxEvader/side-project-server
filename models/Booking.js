const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  birthDate: { type: Date, required: true },
  nationality: { type: String, required: true, trim: true }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  flightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Flight",
    required: true
  },
  passengers: {
    type: Number,
    required: [true, "Passenger count is required"],
    min: 1,
    max: 8
  },
  passengerDetails: {
    type: [passengerSchema],
    validate: {
      validator(details) {
        return details.length === this.passengers;
      },
      message: "Passenger details must match the passenger count"
    }
  },
  cabin: {
    type: String,
    enum: ["economy", "business"],
    default: "economy"
  },
  totalPrice: {
    type: Number,
    required: [true, "Total price is required"],
    min: 0
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Cancelled"],
    default: "Pending"
  },
  paymentMethod: {
    type: String,
    enum: ["card", "pay-later"],
    default: "pay-later"
  },
  contactEmail: { type: String, required: true, trim: true, lowercase: true },
  contactNumber: { type: String, required: true, trim: true },
  reference: { type: String, required: true, unique: true },
  bookingDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
