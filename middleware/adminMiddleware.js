const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const adminProtect = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user && user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied" });
  }
});

module.exports = adminProtect;
