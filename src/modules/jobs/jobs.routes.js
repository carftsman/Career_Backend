const express = require("express");
const router = express.Router();

const jobsController = require("./jobs.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs
 *     description: Fetch all jobs with optional filters like status and search keyword (title, department, skills).
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, CLOSED]
 *         required: false
 *         description: Filter jobs by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: backend
 *         required: false
 *         description: Search jobs by title, department, skills, or description
 *     responses:
 *       200:
 *         description: Jobs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       jobId:
 *                         type: string
 *                         example: "#JOB-2026-001"
 *                       title:
 *                         type: string
 *                         example: Backend Developer
 *                       department:
 *                         type: string
 *                         example: Engineering
 *                       location:
 *                         type: string
 *                         example: Hyderabad
 *                       experience:
 *                         type: integer
 *                         example: 3
 *                       jobType:
 *                         type: string
 *                         example: Full-time
 *                       status:
 *                         type: string
 *                         example: ACTIVE
 *                       applicants:
 *                         type: integer
 *                         example: 5
 *                       postedDate:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

router.get("/", jobsController.getJobs);


/**
 * @swagger
 * /api/jobs/{jobId}:
 *   get:
 *     summary: Get job details
 *     description: Fetch details of a specific job by ID.
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Job details fetched successfully
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:jobId", jobsController.getJobById);


/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job
 *     description: Allows HR to create a new job post in the system.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - title
 *               - department
 *               - location
 *               - experience
 *               - jobType
 *               - description
 *               - skills
 *               - deadline
 *               - hrEmail
 *               - hrPhone
 *             properties:
 *               title:
 *                 type: string
 *                 example: Backend Developer
 *               department:
 *                 type: string
 *                 example: Engineering
 *               location:
 *                 type: string
 *                 example: Remote
 *               experience:
 *                 type: integer
 *                 description: Required years of experience
 *                 example: 3
 *               jobType:
 *                 type: string
 *                 example: Full-time
 *               description:
 *                 type: string
 *                 example: Develop scalable backend APIs using Node.js and PostgreSQL
 *               responsibilities:
 *                 type: string
 *                 description: Key responsibilities for the role
 *                 example: Design REST APIs, optimize performance, collaborate with frontend teams
 *               skills:
 *                 type: string
 *                 description: Required skills for the role
 *                 example: NodeJS, PostgreSQL, Express
 *               deadline:
 *                 type: string
 *                 format: date
 *                 description: Last date to apply for the job
 *                 example: 2026-06-30
 *               hrEmail:
 *                 type: string
 *                 example: hr@company.com
 *               hrPhone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 4
 *                 title:
 *                   type: string
 *                   example: Backend Developer
 *                 status:
 *                   type: string
 *                   example: ACTIVE
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only HR can create jobs
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["HR"]),
  jobsController.createJob
);


/**
 * @swagger
 * /api/jobs/{jobId}/close:
 *   patch:
 *     summary: Close a job
 *     description: HR can close a job listing.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Job closed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.patch(
  "/:jobId/close",
  authMiddleware,
  roleMiddleware(["HR"]),
  jobsController.closeJob
);


/**
 * @swagger
 * /api/jobs/{jobId}/reopen:
 *   patch:
 *     summary: Reopen a job
 *     description: HR can reopen a closed job listing.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Job reopened successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.patch(
  "/:jobId/reopen",
  authMiddleware,
  roleMiddleware(["HR"]),
  jobsController.reopenJob
);

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   patch:
 *     summary: Update an existing job
 *     description: HR can update job details such as title, department, location, experience, job type, description, skills, and deadline.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the job to update
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Backend Developer
 *               department:
 *                 type: string
 *                 example: Engineering
 *               location:
 *                 type: string
 *                 example: Remote
 *               experience:
 *                 type: integer
 *                 example: 3
 *               jobType:
 *                 type: string
 *                 example: Full-time
 *               description:
 *                 type: string
 *                 example: Develop scalable backend APIs
 *               skills:
 *                 type: string
 *                 example: NodeJS, PostgreSQL
 *               deadline:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-30
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.patch(
  "/:jobId",
  authMiddleware,
  roleMiddleware(["HR"]),
  jobsController.updateJob
);


/**
 * @swagger
 * /api/jobs/{jobId}:
 *   delete:
 *     summary: Delete a job
 *     description: HR can delete a job listing from the system.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the job to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.delete(
  "/:jobId",
  authMiddleware,
  roleMiddleware(["HR"]),
  jobsController.deleteJob
);

module.exports = router;