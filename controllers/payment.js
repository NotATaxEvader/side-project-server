const Payment = require("../models/Payment");
const { errorHandler } = require("../auth")

const mongoose = require("mongoose")

module.exports.createPayment = (req, res) => {


    const newPayment = new Payment({
       userId: req.user.id,
       email: req.body.email,
       payments: [{
        amount: req.body.amount,
        description: req.body.description   
       }]
    })
    return newPayment.save().then((result) => res.status(201).send(
        {   userId: req.user.id,
            message: "Payment Created Successfully",
            success: true,
            payment: result
            
        }
    )).catch((err) => {console.log(err)
        errorHandler(err, req, res)})  


}