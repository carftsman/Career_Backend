const express = require("express");
const router = express.Router();
const candidateController = require("./candidate.controller");
const uploadMiddleware = require("../../middlewares/uploadMiddleware");

/**
 * @swagger
 * /api/candidate/signup:
 *   post:
 *     summary: Register a new candidate
 *     description: Candidate creates an account using basic personal details.
 *     tags: [Candidate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - dob
 *               - password
 *               - confirmPassword
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Sushma
 *               lastName:
 *                 type: string
 *                 example: Sree
 *               email:
 *                 type: string
 *                 example: sushma@gmail.com
 *               phone:
 *                 type: string
 *                 example: "9177876659"
 *               dob:
 *                 type: string
 *                 example: "03/15/2000"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               confirmPassword:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Candidate registered successfully
 */
router.post("/signup", candidateController.signup);


/**
 * @swagger
 * /api/candidate/basic-details:
 *   put:
 *     summary: Submit candidate basic details
 *     description: Candidate submits location, skills and resume after signup. These details are saved even if the candidate has not logged in.
 *     tags: [Candidate]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - candidateId
 *               - location
 *               - skills
 *               - resume
 *             properties:
 *               candidateId:
 *                 type: integer
 *                 example: 1
 *               location:
 *                 type: string
 *                 example: Hyderabad
 *               skills:
 *                 type: string
 *                 example: NodeJS, React, PostgreSQL
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Basic details saved successfully
 */
router.put(
  "/basic-details",
  uploadMiddleware.single("resume"),
  candidateController.updateBasicDetails
);


/**
 * @swagger
 * /api/candidate/login:
 *   post:
 *     summary: Candidate login
 *     description: Candidate logs in using email and password.
 *     tags: [Candidate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: sushma@gmail.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", candidateController.login);

module.exports = router;