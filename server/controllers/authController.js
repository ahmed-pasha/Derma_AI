const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { generateToken, setTokenCookie } = require("../utils/generateToken");

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, age, gender, agreedToTerms } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    res.status(400);
    throw new Error("Name, email, password and confirmPassword are required.");
  }
  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match.");
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters.");
  }
  if (!agreedToTerms) {
    res.status(400);
    throw new Error("You must agree to the terms to create an account.");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error("An account with that email already exists.");
  }

  const user = await User.create({ name, email, password, age, gender, agreedToTerms });
  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.status(201).json({ success: true, token, user });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.json({ success: true, token, user: user.toJSON() });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route POST /api/auth/logout
const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out." });
});

module.exports = { register, login, getMe, logout };
