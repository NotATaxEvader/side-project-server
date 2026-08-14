const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");

async function main() {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  if (!email) throw new Error("Usage: npm run set-admin -- user@example.com");
  if (!process.env.MONGODB_STRING) throw new Error("MONGODB_STRING is required in server/.env");

  await mongoose.connect(process.env.MONGODB_STRING);
  const user = await User.findOneAndUpdate({ email }, { isAdmin: true }, { new: true });
  if (!user) throw new Error(`No user found for ${email}. Register the account first.`);
  console.log(`${email} is now an administrator.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
