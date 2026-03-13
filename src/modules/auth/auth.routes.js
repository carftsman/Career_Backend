const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Manager/HR Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */

router.post("/login", authController.login);

module.exports = router;