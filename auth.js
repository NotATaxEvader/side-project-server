const jwt = require("jsonwebtoken");
const User = require("./models/User");
require("dotenv").config();

module.exports.createAccessToken = (user) => jwt.sign({
  id: user._id,
  email: user.email,
  isAdmin: user.isAdmin
}, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });

module.exports.verify = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    return res.status(401).json({ message: error.message || "Invalid authentication token" });
  }

  try {
    const user = await User.findById(decoded.id).select("email isAdmin");
    if (!user) return res.status(401).json({ message: "User account no longer exists" });
    req.user = { id: String(user._id), email: user.email, isAdmin: user.isAdmin };
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports.verifyAdmin = (req, res, next) => {
  if (req.user?.isAdmin === true) return next();
  return res.status(403).json({ message: "Administrator access is required" });
};

module.exports.errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.status || err.statusCode || 500;
  if (err.name === "ValidationError" || err.name === "CastError") statusCode = 400;
  if (err.code === 11000) statusCode = 409;

  const duplicateField = err.keyValue ? Object.keys(err.keyValue)[0] : null;
  const message = duplicateField
    ? `${duplicateField} is already in use`
    : err.message || "Internal server error";

  return res.status(statusCode).json({
    message,
    errorCode: err.code || "SERVER_ERROR",
    details: err.errors || null
  });
};
