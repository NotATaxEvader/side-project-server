const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: [true, "User Id is required for payments"]
	},

	email:{
		type: String,
		required: [true, "Email is required for payments"]			
		},

	payments: [{
		amount: {
			type: Number,
			required: [true, "Amount required for payments"]
		},

		description: {
			type: String,
			required: [true, "Description for details in payment"]
		},


		date: {
			type: Date,
			default: Date.now
		}
	}],

	status:{
		type: String,
		default: "Pending..."
	}

	})

module.exports = mongoose.model("Payment", paymentSchema);
