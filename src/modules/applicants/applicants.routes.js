const express = require("express");
const router = express.Router();

const applicantsController = require("./applicants.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

/**
 * @swagger
 * /api/applicants:
 *   get:
 *     summary: Get all applicants
 *     description: Returns a list of candidates who applied for jobs. Supports filtering by search, skills, experience, job title, location, month, and year.
 *     tags: [Applicants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by candidate name or email
 *         example: john
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by skill
 *         example: NodeJS
 *       - in: query
 *         name: experience
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by years of experience
 *         example: 3
 *       - in: query
 *         name: jobTitle
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by job title
 *         example: Backend Developer
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by candidate location
 *         example: Hyderabad
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by application month
 *         example: 3
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by application year
 *         example: 2026
 *     responses:
 *       200:
 *         description: Applicants fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applicants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Jane Doe
 *                       email:
 *                         type: string
 *                         example: jane@example.com
 *                       phone:
 *                         type: string
 *                         example: "9876543210"
 *                       jobTitle:
 *                         type: string
 *                         example: Backend Developer
 *                       experience:
 *                         type: integer
 *                         example: 5
 *                       skills:
 *                         type: string
 *                         example: NodeJS, React
 *                       location:
 *                         type: string
 *                         example: Hyderabad
 *                       resume:
 *                         type: string
 *                         example: https://storage.blob/resume.pdf
 *                       appliedDate:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-03-16T10:00:00Z
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER"]),
  applicantsController.getApplicants
);


/**
 * @swagger
 * /api/applicants/export-all:
 *   get:
 *     summary: Export all applicants
 *     description: Download a CSV file containing all applicants in the system.
 *     tags: [Applicants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download containing all applicants
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: Name,Email,Phone,JobTitle,Experience
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/export-all",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER"]),
  applicantsController.exportAllApplicants
);


/**
 * @swagger
 * /api/applicants/export:
 *   post:
 *     summary: Export selected applicants
 *     description: Download a CSV file for selected applicants using their IDs.
 *     tags: [Applicants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1,2,3]
 *     responses:
 *       200:
 *         description: CSV file download containing selected applicants
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/export",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER"]),
  applicantsController.exportSelectedApplicants
);

/**
 * @swagger
 * /api/applicants/monthly-report:
 *   get:
 *     summary: Generate monthly applicants report
 *     description: Returns analytics of applicants for the current month.
 *     tags: [Applicants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly report generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/monthly-report",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER"]),
  applicantsController.getMonthlyReport
);

module.exports = router;