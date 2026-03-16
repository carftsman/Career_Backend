const express = require("express");
const router = express.Router();
const candidateController = require("./candidate.controller");
const uploadMiddleware = require("../../middlewares/uploadMiddleware");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

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

/**
 * @swagger
 * /api/candidate/profile:
 *   get:
 *     summary: Get candidate profile
 *     description: Returns the logged-in candidate's profile details. Used to autofill the job application form.
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firstName:
 *                   type: string
 *                   example: Sushma
 *                 lastName:
 *                   type: string
 *                   example: Sree
 *                 email:
 *                   type: string
 *                   example: sushma@gmail.com
 *                 phone:
 *                   type: string
 *                   example: "9876543210"
 *                 location:
 *                   type: string
 *                   example: Hyderabad
 *                 skills:
 *                   type: string
 *                   example: NodeJS, React
 *                 resumeUrl:
 *                   type: string
 *                   example: https://storage.blob.core.windows.net/resumes/resume.pdf
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware(["CANDIDATE"]),
  candidateController.getProfile
);

module.exports = router;