const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Generate Token
const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { walletAddress, emailAddress, password, referralCode } = req.body;

  // Validation
  if (!walletAddress || !emailAddress || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // Check if user email already exists
  const userExists = await User.findOne({ emailAddress });

  if (userExists) {
    res.status(400);
    throw new Error("Email has already been registered");
  }

  // Create new user
  const user = await User.create({
    walletAddress,
    emailAddress,
    password,
    referredBy: referralCode,
  });

  // Award points to referrer if referral code is valid
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer) {
      referrer.points += 500000; // Award points to referrer
      await referrer.save();
      console.log(`Points added to referrer: ${referrer.emailAddress}`);
    } else {
      console.log(`Invalid referral code: ${referralCode}`);
    }
  }

 

  // Generate Token
  const token = generateToken(user._id);

  // Send HTTP-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });
  // techi22333@gmail.com

  if (user) {
    const { _id, walletAddress, emailAddress, points,referralCode } = user;
    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id,
        emailAddress,
        walletAddress,
        points,
        referralCode
      },
      token,
    });
  } else {
    res.status(400).json({ error: "Invalid user data" });
  }
});



// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { emailAddress, password } = req.body;

  // Validate Request
  if (!emailAddress || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check if user exists
  const user = await User.findOne({ emailAddress });

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  // User exists, check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  if (passwordIsCorrect) {
    // Check if the user's email is in the admin emails list
    const adminEmails = ["yhuteecodes@gmail.com", "codedflexy555@gmail.com"];
    if (adminEmails.includes(user.emailAddress)) {
      user.role = "admin";
      await user.save();
    }

    // Generate Token
    const token = generateToken(user._id);

    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });

    const { _id, walletAddress, emailAddress, points, role } = user;
    res.status(200).json({
      message: "User logged in successfully",
      user: {
        _id,
        emailAddress,
        walletAddress,
        points,
        role,
      },
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

module.exports = loginUser;

// Logout User
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

const getReferredUsers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const referredUsers = await User.find({ referredBy: user.referralCode });

  res.status(200).json({
    referredUsers: referredUsers.map(u => ({
      email: u.emailAddress,
      walletAddress: u.walletAddress,
      points: u.points,
      registeredAt: u.createdAt,
    })),
  });
});

// Get User Data
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const {
      _id,
      walletAddress,
      emailAddress,
      points,
      withdrawnPoints,
      totalPaid,
      role,
      referralCode
    } = user;
    res.status(200).json({
      _id,
      walletAddress,
      emailAddress,
      points,
      withdrawnPoints,
      totalPaid,
      role,
      referralCode
    });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});

// new

const updatePoints = asyncHandler(async (req, res) => {
  const { userId, points } = req.body;
  const user = await User.findById(userId);

  if (user) {
    const today = new Date().toISOString().split("T")[0];
    const todaysSpins = user.spinHistory.filter(
      spin => spin.date.toISOString().split("T")[0] === today
    ).length;

    if (todaysSpins >= 10) {
      res.status(400).json({
        message: "You have reached the maximum number of spins for today.",
      });
      return;
    }

    user.points += points;
    user.spinHistory.push({ date: new Date() });
    await user.save();

    res.status(200).json({
      _id: user._id,
      walletAddress: user.walletAddress,
      emailAddress: user.emailAddress,
      points: user.points,
    });
  } else {
    res.status(400).json({ error: "User Not Found" });
  }
});

// get spin count
const getSpinCount = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (user) {
    const today = new Date().toISOString().split("T")[0];
    const spinCount = user.spinHistory.filter(
      spin => spin.date.toISOString().split("T")[0] === today
    ).length;

    res.status(200).json({ spinCount });
  } else {
    res.status(400).json({ error: "User Not Found" });
  }
});

// withdraw
const withdrawPoints = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Get user ID from the authenticated user

  const user = await User.findById(userId);

  if (user) {
    const pointsToWithdraw = user.points;
    user.points = 0;
    user.withdrawnPoints += pointsToWithdraw; // Update the withdrawnPoints field
    await user.save();
    res.status(200).json({
      message: "All points withdrawn successfully",
      points: user.points,
      withdrawnPoints: user.withdrawnPoints,
    });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});
// pay users
const payUsers = asyncHandler(async (req, res) => {
  const adminUserId = req.user.id; // Get admin user ID from the authenticated user

  // Check if the user is an admin
  const adminUser = await User.findById(adminUserId);
  if (!adminUser || adminUser.role !== "admin") {
    return res.status(403).json({ error: "Access denied, admin only" });
  }

  const { userId } = req.body;
  const user = await User.findById(userId);

  if (user) {
    user.totalPaid += user.withdrawnPoints;
    user.withdrawnPoints = 0;
    await user.save();
    res.status(200).json({
      message: "Payment processed successfully",
      totalPaid: user.totalPaid,
    });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});
// Get ALL Users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}); // Retrieve all users

  if (users) {
    // Map the user data to remove sensitive information
    const userList = users.map(user => {
      const {
        _id,
        walletAddress,
        emailAddress,
        points,
        withdrawnPoints,
        totalPaid,
      } = user;
      return {
        _id,
        walletAddress,
        emailAddress,
        points,
        withdrawnPoints,
        totalPaid,
      };
    });

    res.status(200).json(userList);
  } else {
    res.status(400);
    throw new Error("No users found");
  }
});

// delete all
// router.delete('/delete-all',
const deleteAllUsers = asyncHandler(async (req, res) => {
  const result = await User.deleteMany({}); // Delete all users

  if (result.deletedCount > 0) {
    res.status(200).json({ message: "All users deleted successfully" });
  } else {
    res.status(400);
    throw new Error("No users found to delete");
  }
});

// Get Login Status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, email, photo, phone, bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    user.photo = req.body.photo || photo;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password change successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // Delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Reste Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);

  // Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save Token to DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset Email
  const message = `
      <h2>Hello ${user.name}</h2>
      <p>Please use the url below to reset your password</p>  
      <p>This reset link is valid for only 30minutes.</p>

      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>  

      <p>Regards...</p>       
      <p>Target Team</p>
    `;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare to Token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // fIND tOKEN in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});

module.exports = {
  registerUser,
  loginUser,
  updatePoints,
  payUsers,
  logout,
  getUser,
  getAllUsers,
  getSpinCount,
  withdrawPoints,
  loginStatus,
  deleteAllUsers,
  updateUser,
  changePassword,
  getReferredUsers,
  forgotPassword,
  resetPassword,
};
