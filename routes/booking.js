const express = require("express");
const bookingController = require("../controllers/booking");
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

router.get("/my-bookings", verify, bookingController.getMyBookings);
router.get("/", verify, verifyAdmin, bookingController.getAllBookings);
router.post("/", verify, bookingController.addBooking);
router.get("/:id", verify, bookingController.getBooking);
router.patch("/:id/cancel", verify, bookingController.cancelBooking);
router.patch("/:id/status", verify, verifyAdmin, bookingController.updateBookingStatus);

module.exports = router;
