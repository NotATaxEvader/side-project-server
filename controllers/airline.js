const Airline = require("../models/Airline");
const Flight = require("../models/Flights");

function airlinePayload(body) {
  return {
    name: String(body.name || "").trim(),
    code: String(body.code || "").trim().toUpperCase(),
    rating: Number(body.rating)
  };
}

module.exports.getAirlines = async (req, res, next) => {
  try {
    const airlines = await Airline.find({}).sort({ name: 1 });
    return res.status(200).json({ airlines });
  } catch (error) {
    return next(error);
  }
};

module.exports.getAirline = async (req, res, next) => {
  try {
    const airline = await Airline.findById(req.params.airlineId);
    if (!airline) return res.status(404).json({ message: "Airline not found" });
    return res.status(200).json({ airline });
  } catch (error) {
    return next(error);
  }
};

module.exports.createAirline = async (req, res, next) => {
  try {
    const airline = await Airline.create(airlinePayload(req.body));
    return res.status(201).json({ airline });
  } catch (error) {
    return next(error);
  }
};

module.exports.updateAirline = async (req, res, next) => {
  try {
    const airline = await Airline.findByIdAndUpdate(
      req.params.airlineId,
      airlinePayload(req.body),
      { new: true, runValidators: true }
    );
    if (!airline) return res.status(404).json({ message: "Airline not found" });
    return res.status(200).json({ airline });
  } catch (error) {
    return next(error);
  }
};

module.exports.deleteAirline = async (req, res, next) => {
  try {
    if (await Flight.exists({ airline: req.params.airlineId })) {
      return res.status(409).json({ message: "Airlines assigned to flights cannot be deleted" });
    }
    const airline = await Airline.findByIdAndDelete(req.params.airlineId);
    if (!airline) return res.status(404).json({ message: "Airline not found" });
    return res.status(200).json({ message: "Airline deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
