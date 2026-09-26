const express = require('express');

const {
  signup,
  verifyEmail,
  resendOtp,
  login,
  getMe,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Create account and send OTP
router.post('/signup', signup);

// Verify email OTP
router.post('/verify-email', verifyEmail);

// Send a new OTP
router.post('/resend-otp', resendOtp);

// Login
router.post('/login', login);

// Get currently authenticated user
router.get('/me', protect, getMe);

module.exports = router;