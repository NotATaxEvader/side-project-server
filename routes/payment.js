const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment");
const { verify, verifyAdmin } = require("../auth");


router.post("/payment", verify, paymentController.createPayment);


module.exports = router