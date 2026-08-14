const Booking = require("../models/Booking");
const Flight = require("../models/Flights");

function withBookingDetails(query) {
  return query
    .populate("userId", "firstName lastName email mobileNo isAdmin createdAt")
    .populate({ path: "flightId", populate: { path: "airline" } });
}

function bookingReference() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ALT-${time}-${random}`;
}

function canAccessBooking(booking, user) {
  const ownerId = booking.userId?._id || booking.userId;
  return user.isAdmin || String(ownerId) === String(user.id);
}

module.exports.addBooking = async (req, res, next) => {
  let reservedFlight = null;
  let seatField = null;
  let passengers = 0;
  let bookingCreated = false;

  try {
    if (req.user.isAdmin) {
      return res.status(403).json({ message: "Administrators cannot create customer bookings" });
    }

    passengers = Number(req.body.passengers);
    const cabin = req.body.cabin === "business" ? "business" : "economy";
    const passengerDetails = Array.isArray(req.body.passengerDetails) ? req.body.passengerDetails : [];
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 8) {
      return res.status(400).json({ message: "Passenger count must be between 1 and 8" });
    }
    if (passengerDetails.length !== passengers) {
      return res.status(400).json({ message: "Complete the details for every passenger" });
    }

    seatField = cabin === "business" ? "busSeatsAvailable" : "ecoSeatsAvailable";
    reservedFlight = await Flight.findOneAndUpdate(
      {
        _id: req.body.flightId,
        status: { $ne: "Cancelled" },
        [seatField]: { $gte: passengers }
      },
      { $inc: { [seatField]: -passengers } },
      { new: true }
    );

    if (!reservedFlight) {
      return res.status(409).json({ message: "The selected flight is unavailable or does not have enough seats" });
    }

    const fareMultiplier = cabin === "business" ? 1.85 : 1;
    let booking = await Booking.create({
      userId: req.user.id,
      flightId: reservedFlight._id,
      passengers,
      passengerDetails,
      cabin,
      totalPrice: Math.round(reservedFlight.price * fareMultiplier * passengers),
      paymentMethod: req.body.paymentMethod === "card" ? "card" : "pay-later",
      contactEmail: req.body.contactEmail,
      contactNumber: req.body.contactNumber,
      reference: bookingReference()
    });
    bookingCreated = true;

    booking = await withBookingDetails(Booking.findById(booking._id));
    return res.status(201).json({ message: "Booked successfully", booking });
  } catch (error) {
    if (reservedFlight && !bookingCreated && seatField && passengers) {
      await Flight.updateOne({ _id: reservedFlight._id }, { $inc: { [seatField]: passengers } }).catch(() => {});
    }
    return next(error);
  }
};

module.exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await withBookingDetails(
      Booking.find({ userId: req.user.id }).sort({ bookingDate: -1 })
    );
    return res.status(200).json({ bookings });
  } catch (error) {
    return next(error);
  }
};

module.exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await withBookingDetails(Booking.find({}).sort({ bookingDate: -1 }));
    return res.status(200).json({ bookings });
  } catch (error) {
    return next(error);
  }
};

module.exports.getBooking = async (req, res, next) => {
  try {
    const booking = await withBookingDetails(Booking.findById(req.params.id));
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!canAccessBooking(booking, req.user)) {
      return res.status(403).json({ message: "You do not have access to this booking" });
    }
    return res.status(200).json({ booking });
  } catch (error) {
    return next(error);
  }
};

module.exports.cancelBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!canAccessBooking(booking, req.user)) {
      return res.status(403).json({ message: "You do not have access to this booking" });
    }

    if (booking.status !== "Cancelled") {
      const cancelledBooking = await Booking.findOneAndUpdate(
        { _id: booking._id, status: { $ne: "Cancelled" } },
        { status: "Cancelled" },
        { new: true }
      );
      const seatField = booking.cabin === "business" ? "busSeatsAvailable" : "ecoSeatsAvailable";
      if (cancelledBooking) {
        await Flight.updateOne(
          { _id: booking.flightId },
          { $inc: { [seatField]: booking.passengers } }
        );
      }
    }

    booking = await withBookingDetails(Booking.findById(booking._id));
    return res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) {
    return next(error);
  }
};

module.exports.updateBookingStatus = async (req, res, next) => {
  try {
    const status = String(req.body.status || "");
    if (!["Pending", "Paid"].includes(status)) {
      return res.status(400).json({ message: "Status must be Pending or Paid" });
    }
    let booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    booking = await withBookingDetails(Booking.findById(booking._id));
    return res.status(200).json({ message: "Booking status updated", booking });
  } catch (error) {
    return next(error);
  }
};
