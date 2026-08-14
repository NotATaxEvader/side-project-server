const mongoose = require("mongoose");

const airlineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Airline name is required"],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, "Airline code is required"],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 3
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 4
  }
}, { timestamps: true });

module.exports = mongoose.model("Airline", airlineSchema);
