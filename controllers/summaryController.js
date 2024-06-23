const asyncHandler = require("express-async-handler");
const Summary = require("../models/summaryModel");



// Create Prouct
const createSummary = asyncHandler(async (req, res) => {
  const {  points } = req.body;

  //   Validation
  if (!points ) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }


  // Create Product
  const summary = await Summary.create({
    user: req.user.id,
    points,
  });

  res.status(201).json(summary);
});

// Get all Products
const getAllSummary = asyncHandler(async (req, res) => {
  const summary = await Summary.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(summary);
});

// Get single product
const getSummary= asyncHandler(async (req, res) => {
  const summary = await Summary.findById(req.params.id);
  // if product doesnt exist
  if (!summary) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  if (summary.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  res.status(200).json(summary);
});



module.exports = {
    createSummary,
    getAllSummary,
  getSummary,
  
};
