const express = require("express");
const flightController = require("../controllers/flights");
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

router.get("/", flightController.getAllFlights);
router.get("/:flightId", flightController.getFlight);
router.post("/", verify, verifyAdmin, flightController.createFlight);
router.patch("/:flightId", verify, verifyAdmin, flightController.updateFlight);
router.delete("/:flightId", verify, verifyAdmin, flightController.deleteFlight);

module.exports = router;
