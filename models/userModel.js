const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: [true, "Please add your wallet address"],
    },
    points: {
      type: Number,
      required: true,
      default: 0,
    },
    withdrawnPoints: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    emailAddress: {
      type: String,
      required: [true, "Please add an email address"],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minLength: [6, "Password must be up to 6 characters"],
    },
    role: {
      type: String,
      default: "user",
    },
    spinHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to generate referral code only when a new user is created
userSchema.pre("save", async function (next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = crypto.randomBytes(4).toString("hex"); // Generate a simple referral code
  }
  next();
});

// Encrypt password before saving to DB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
