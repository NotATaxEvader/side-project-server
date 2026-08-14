const express = require("express");
const airlineController = require("../controllers/airline");
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

router.get("/", airlineController.getAirlines);
router.get("/:airlineId", airlineController.getAirline);
router.post("/", verify, verifyAdmin, airlineController.createAirline);
router.patch("/:airlineId", verify, verifyAdmin, airlineController.updateAirline);
router.delete("/:airlineId", verify, verifyAdmin, airlineController.deleteAirline);

module.exports = router;
