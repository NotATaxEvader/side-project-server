const bcrypt = require("bcrypt");
const User = require("../models/User");
const { createAccessToken } = require("../auth");

function normalizedEmail(value) {
  return String(value || "").trim().toLowerCase();
}

module.exports.registerUser = async (req, res, next) => {
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const email = normalizedEmail(req.body.email);
    const password = String(req.body.password || "");
    const mobileNo = String(req.body.mobileNo || "").trim();

    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (!/^[0-9+ -]{7,15}$/.test(mobileNo)) {
      return res.status(400).json({ message: "Enter a valid contact number" });
    }

    const existingUser = await User.exists({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account already uses this email" });
    }

    await User.create({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
      mobileNo
    });

    return res.status(201).json({ message: "Registered successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports.loginUser = async (req, res, next) => {
  try {
    const email = normalizedEmail(req.body.email);
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email and password do not match" });
    }

    return res.status(200).json({ access: createAccessToken(user) });
  } catch (error) {
    return next(error);
  }
};

module.exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
};

module.exports.updateProfile = async (req, res, next) => {
  try {
    const email = normalizedEmail(req.body.email);
    const update = {
      firstName: String(req.body.firstName || "").trim(),
      lastName: String(req.body.lastName || "").trim(),
      email,
      mobileNo: String(req.body.contactNumber || req.body.mobileNo || "").trim()
    };

    if (!update.firstName || !update.lastName || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Valid name and email fields are required" });
    }
    if (!/^[0-9+ -]{7,15}$/.test(update.mobileNo)) {
      return res.status(400).json({ message: "Enter a valid contact number" });
    }

    const duplicate = await User.exists({ email, _id: { $ne: req.user.id } });
    if (duplicate) return res.status(409).json({ message: "An account already uses this email" });

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
};

module.exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
};

module.exports.updateUserRole = async (req, res, next) => {
  try {
    const role = String(req.body.role || "").toLowerCase();
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be user or admin" });
    }
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot change your own administrator role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: role === "admin" },
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
};

module.exports.updatePassword = async (req, res, next) => {
  try {
    const newPassword = String(req.body.newPassword || "");
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return next(error);
  }
};
