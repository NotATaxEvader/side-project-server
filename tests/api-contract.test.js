const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");

process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "test-secret";

const { verify } = require("../auth");
const Airline = require("../models/Airline");
const Booking = require("../models/Booking");
const Flight = require("../models/Flights");
const airlineRoutes = require("../routes/airline");
const bookingRoutes = require("../routes/booking");
const flightRoutes = require("../routes/flights");
const userRoutes = require("../routes/user");

function routeContract(router) {
  return router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => Object.keys(layer.route.methods).map(
      (method) => `${method.toUpperCase()} ${layer.route.path}`
    ));
}

test("routers expose the frontend endpoint contract", async () => {
  const { API_ENDPOINTS } = await import("../../src/services/endpoints.js");

  assert.deepEqual(routeContract(userRoutes), [
    "POST /register",
    "POST /login",
    "GET /details",
    "PATCH /details",
    "PATCH /update-password",
    "GET /",
    "PATCH /:id/role"
  ]);
  assert.deepEqual(routeContract(flightRoutes), [
    "GET /",
    "GET /:flightId",
    "POST /",
    "PATCH /:flightId",
    "DELETE /:flightId"
  ]);
  assert.deepEqual(routeContract(airlineRoutes), [
    "GET /",
    "GET /:airlineId",
    "POST /",
    "PATCH /:airlineId",
    "DELETE /:airlineId"
  ]);
  assert.deepEqual(routeContract(bookingRoutes), [
    "GET /my-bookings",
    "GET /",
    "POST /",
    "GET /:id",
    "PATCH /:id/cancel",
    "PATCH /:id/status"
  ]);

  assert.equal(API_ENDPOINTS.login, "/users/login");
  assert.equal(API_ENDPOINTS.register, "/users/register");
  assert.equal(API_ENDPOINTS.profile, "/users/details");
  assert.equal(API_ENDPOINTS.users, "/users");
  assert.equal(API_ENDPOINTS.userRole("user-id"), "/users/user-id/role");
  assert.equal(API_ENDPOINTS.flights, "/flights");
  assert.equal(API_ENDPOINTS.flight("flight-id"), "/flights/flight-id");
  assert.equal(API_ENDPOINTS.airlines, "/airlines");
  assert.equal(API_ENDPOINTS.airline("airline-id"), "/airlines/airline-id");
  assert.equal(API_ENDPOINTS.bookings, "/bookings");
  assert.equal(API_ENDPOINTS.myBookings, "/bookings/my-bookings");
  assert.equal(API_ENDPOINTS.booking("booking-id"), "/bookings/booking-id");
  assert.equal(API_ENDPOINTS.cancelBooking("booking-id"), "/bookings/booking-id/cancel");
  assert.equal(API_ENDPOINTS.bookingStatus("booking-id"), "/bookings/booking-id/status");
});

test("bearer middleware rejects missing authentication", () => {
  let statusCode;
  let payload;
  let calledNext = false;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    }
  };

  verify({ headers: {} }, response, () => { calledNext = true; });
  assert.equal(statusCode, 401);
  assert.equal(payload.message, "Authentication token is required");
  assert.equal(calledNext, false);
});

test("frontend-shaped airline, flight, and booking records pass schema validation", async () => {
  const airlineId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const flightId = new mongoose.Types.ObjectId();

  await new Airline({ name: "Example Air", code: "EA", rating: 4.5 }).validate();
  await new Flight({
    _id: flightId,
    airline: airlineId,
    flightNumber: "EA 101",
    departure: "MNL",
    destination: "NRT",
    departureDate: new Date("2026-09-01T01:00:00Z"),
    arrivalDate: new Date("2026-09-01T05:00:00Z"),
    price: 6000,
    ecoSeatsAvailable: 30,
    busSeatsAvailable: 6,
    isDirect: true,
    status: "Scheduled"
  }).validate();
  await new Booking({
    userId,
    flightId,
    passengers: 1,
    passengerDetails: [{
      firstName: "Ada",
      lastName: "Lovelace",
      birthDate: new Date("1990-01-01"),
      nationality: "Filipino"
    }],
    cabin: "economy",
    totalPrice: 6000,
    paymentMethod: "pay-later",
    contactEmail: "ada@example.com",
    contactNumber: "09123456789",
    reference: "ALT-TEST-0001"
  }).validate();
});
