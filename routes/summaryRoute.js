const express = require('express');
const { createSummary,getAllSummary, getSummary } = require('../controllers/summaryController');
const protect  = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .put(protect, createSummary)
  .get(protect, getAllSummary);

router.route('/:id')
  .get(protect, getSummary);

module.exports = router;
