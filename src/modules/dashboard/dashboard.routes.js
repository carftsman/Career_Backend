const express = require("express");
const router = express.Router();

const dashboardController = require("./dashboard.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get recruitment dashboard overview
 *     description: Returns statistics required for the HR/Manager dashboard including job counts, applicants, candidates, and recent job posts.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard overview fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalJobs:
 *                   type: integer
 *                   example: 124
 *                 activeJobs:
 *                   type: integer
 *                   example: 42
 *                 closedJobs:
 *                   type: integer
 *                   example: 82
 *                 totalApplicants:
 *                   type: integer
 *                   example: 1482
 *                 appliedThisMonth:
 *                   type: integer
 *                   example: 320
 *                 registeredCandidates:
 *                   type: integer
 *                   example: 8245
 *                 recentJobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: Senior Product Designer
 *                       department:
 *                         type: string
 *                         example: Design
 *                       location:
 *                         type: string
 *                         example: San Francisco, CA
 *                       applicants:
 *                         type: integer
 *                         example: 24
 *                       postedDate:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-03-15T10:00:00Z
 *                       status:
 *                         type: string
 *                         example: ACTIVE
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Internal server error
 */

router.get(
  "/overview",
  dashboardController.getDashboardOverview
);

module.exports = router;