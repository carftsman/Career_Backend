// routes/candidateAuth.routes.js

const express = require("express");
const {
  forgotPassword,
  resetPassword
} = require("./candidateAuth.controller");

const router = express.Router();

/**
 * @swagger
 * /api/candidate/forgot-password:
 *   post:
 *     summary: Forgot password (Candidate)
 *     description: Sends a password reset link to the candidate's email
 *     tags:
 *       - Candidate Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: "candidate@gmail.com"
 *     responses:
 *       200:
 *         description: Reset link sent (if email exists)
 *         content:
 *           application/json:
 *             example:
 *               message: "If email exists, reset link sent"
 *       500:
 *         description: Internal server error
 */
router.post("/forgot-password", forgotPassword);
/**
 * @swagger
 * /api/candidate/reset-password:
 *   post:
 *     summary: Reset password (Candidate)
 *     description: Reset password using token received via email
 *     tags:
 *       - Candidate Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             token: "reset-token-from-email"
 *             newPassword: "NewPassword@123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             example:
 *               message: "Password reset successful"
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid or expired token"
 *       500:
 *         description: Internal server error
 */
router.post("/reset-password", resetPassword);

module.exports = router;