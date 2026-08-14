const mongoose = require("mongoose");
require("dotenv").config();

const Airline = require("../models/Airline");

function codeFromName(name) {
  const letters = name.replace(/[^a-z]/gi, "").toUpperCase();
  return (letters.slice(0, 3) || "AIR").padEnd(2, "X");
}

async function airlineFor(name) {
  const airlineName = String(name || "Legacy Airline").trim();
  const existing = await Airline.findOne({ name: airlineName });
  if (existing) return existing;

  const baseCode = codeFromName(airlineName);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = attempt === 0
      ? baseCode
      : `${baseCode.charAt(0)}${String(attempt).padStart(2, "0")}`;
    if (!(await Airline.exists({ code }))) {
      return Airline.create({ name: airlineName, code, rating: 4 });
    }
  }
  throw new Error(`Could not generate a unique airline code for ${airlineName}`);
}

async function main() {
  if (!process.env.MONGODB_STRING) throw new Error("MONGODB_STRING is required in server/.env");
  await mongoose.connect(process.env.MONGODB_STRING);

  const flights = mongoose.connection.collection("flights");
  const legacyFlights = await flights.find({
    $or: [
      { arrival: { $exists: true } },
      { availableSeats: { $exists: true } },
      { isActive: { $exists: true } }
    ]
  }).toArray();

  let migrated = 0;
  for (const flight of legacyFlights) {
    const airline = flight.airline instanceof mongoose.Types.ObjectId
      ? { _id: flight.airline }
      : await airlineFor(flight.airline);
    const departure = flight.departure?.airport || flight.departure;
    const destination = flight.arrival?.airport || flight.destination;
    const departureDate = flight.departure?.departureTime || flight.departureDate;
    const arrivalDate = flight.arrival?.arrivalTime || flight.arrivalDate;

    if (!departure || !destination || !departureDate || !arrivalDate) {
      console.warn(`Skipped ${flight._id}: route or schedule data is incomplete.`);
      continue;
    }

    await flights.updateOne({ _id: flight._id }, {
      $set: {
        airline: airline._id,
        departure: String(departure).toUpperCase(),
        destination: String(destination).toUpperCase(),
        departureDate: new Date(departureDate),
        arrivalDate: new Date(arrivalDate),
        ecoSeatsAvailable: Number(flight.ecoSeatsAvailable ?? flight.availableSeats ?? 0),
        busSeatsAvailable: Number(flight.busSeatsAvailable ?? 0),
        isDirect: flight.isDirect ?? true,
        status: flight.status || (flight.isActive === false ? "Cancelled" : "Scheduled"),
        updatedAt: new Date()
      },
      $unset: { arrival: "", availableSeats: "", isActive: "", createdOn: "" }
    });
    migrated += 1;
  }

  console.log(`Migrated ${migrated} legacy flight record(s).`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
