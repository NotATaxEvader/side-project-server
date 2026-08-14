const Booking = require("../models/Booking");
const Flight = require("../models/Flights");
const Airline = require("../models/Airline");

function flightPayload(body) {
  return {
    airline: body.airline,
    flightNumber: String(body.flightNumber || "").trim(),
    departure: String(body.departure || "").trim().toUpperCase(),
    destination: String(body.destination || "").trim().toUpperCase(),
    departureDate: body.departureDate,
    arrivalDate: body.arrivalDate,
    price: Number(body.price),
    ecoSeatsAvailable: Number(body.ecoSeatsAvailable),
    busSeatsAvailable: Number(body.busSeatsAvailable),
    isDirect: Boolean(body.isDirect),
    status: body.status || "Scheduled"
  };
}

async function validateFlight(payload, res) {
  if (!payload.flightNumber || !payload.departure || !payload.destination) {
    res.status(400).json({ message: "Flight number, departure, and destination are required" });
    return false;
  }
  if (payload.departure === payload.destination) {
    res.status(400).json({ message: "Departure and destination must be different" });
    return false;
  }
  if (!payload.departureDate || !payload.arrivalDate || new Date(payload.arrivalDate) <= new Date(payload.departureDate)) {
    res.status(400).json({ message: "Arrival must be later than departure" });
    return false;
  }
  if (![payload.price, payload.ecoSeatsAvailable, payload.busSeatsAvailable].every(Number.isFinite)) {
    res.status(400).json({ message: "Price and seat inventory must be valid numbers" });
    return false;
  }
  if (!(await Airline.exists({ _id: payload.airline }))) {
    res.status(400).json({ message: "Select a valid airline" });
    return false;
  }
  return true;
}

module.exports.createFlight = async (req, res, next) => {
  try {
    const payload = flightPayload(req.body);
    if (!(await validateFlight(payload, res))) return;
    let flight = await Flight.create(payload);
    flight = await flight.populate("airline");
    return res.status(201).json({ flight });
  } catch (error) {
    return next(error);
  }
};

module.exports.getAllFlights = async (req, res, next) => {
  try {
    const flights = await Flight.find({ status: { $ne: "Cancelled" } })
      .populate("airline")
      .sort({ departureDate: 1 });
    return res.status(200).json({ flights });
  } catch (error) {
    return next(error);
  }
};

module.exports.getFlight = async (req, res, next) => {
  try {
    const flight = await Flight.findById(req.params.flightId).populate("airline");
    if (!flight) return res.status(404).json({ message: "Flight not found" });
    return res.status(200).json({ flight });
  } catch (error) {
    return next(error);
  }
};

module.exports.updateFlight = async (req, res, next) => {
  try {
    const payload = flightPayload(req.body);
    if (!(await validateFlight(payload, res))) return;
    const flight = await Flight.findByIdAndUpdate(req.params.flightId, payload, {
      new: true,
      runValidators: true
    }).populate("airline");
    if (!flight) return res.status(404).json({ message: "Flight not found" });
    return res.status(200).json({ message: "Flight updated successfully", flight });
  } catch (error) {
    return next(error);
  }
};

module.exports.deleteFlight = async (req, res, next) => {
  try {
    const hasBookings = await Booking.exists({ flightId: req.params.flightId });
    if (hasBookings) {
      return res.status(409).json({ message: "Flights with bookings cannot be deleted" });
    }
    const flight = await Flight.findByIdAndDelete(req.params.flightId);
    if (!flight) return res.status(404).json({ message: "Flight not found" });
    return res.status(200).json({ message: "Flight deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
