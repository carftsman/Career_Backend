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
 *     description: Fetch all jobs with filters like status, search, experience range, and salary range.
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, CLOSED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: backend
 *       - in: query
 *         name: minExperience
 *         schema:
 *           type: integer
 *           example: 2
 *       - in: query
 *         name: maxExperience
 *         schema:
 *           type: integer
 *           example: 5
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: integer
 *           example: 300000
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: integer
 *           example: 1000000
 *     responses:
 *       200:
 *         description: Jobs fetched successfully
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
 *     description: Allows HR to create a new job post with salary and experience range.
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
 *               - title
 *               - department
 *               - location
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
 *                 example: Hyderabad
 *
 *               # ✅ EXPERIENCE (NEW STRUCTURE)
 *               minExperience:
 *                 type: integer
 *                 example: 2
 *               maxExperience:
 *                 type: integer
 *                 example: 5
 *
 *               jobType:
 *                 type: string
 *                 example: Full-time
 *
 *               description:
 *                 type: string
 *                 example: Develop scalable backend APIs
 *
 *               responsibilities:
 *                 type: string
 *                 example: Build APIs, optimize performance
 *
 *               skills:
 *                 type: string
 *                 example: NodeJS, PostgreSQL, Express
 * 
 *               minSalary:
 *                 type: integer
 *                 example: 500000
 *               maxSalary:
 *                 type: integer
 *                 example: 1000000
 *               currency:
 *                 type: string
 *                 example: INR
 *
 *               deadline:
 *                 type: string
 *                 format: date
 *                 example: 2026-12-31
 *
 *               hrEmail:
 *                 type: string
 *                 example: hr@dhatvibs.com
 *
 *               hrPhone:
 *                 type: string
 *                 example: "9876543210"
 *
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job created successfully
 *                 job:
 *                   type: object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only HR can create jobs
 *       500:
 *         description: Internal server error
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
 *     summary: Reopen and update a job
 *     description: Allows HR to reopen a closed job and update job details including experience range and salary.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         description: ID or JOB-XXXX of the job to reopen
 *         schema:
 *           type: string
 *           example: JOB-2026-021
 *     requestBody:
 *       required: false
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
 *                 example: Hyderabad

 *               # ✅ EXPERIENCE RANGE
 *               minExperience:
 *                 type: integer
 *                 example: 2
 *               maxExperience:
 *                 type: integer
 *                 example: 5
 *               experienceLabel:
 *                 type: string
 *                 example: 2-5 years

 *               jobType:
 *                 type: string
 *                 example: Full-time

 *               description:
 *                 type: string
 *                 example: Build scalable backend APIs

 *               responsibilities:
 *                 type: string
 *                 example: Develop APIs, optimize performance

 *               skills:
 *                 type: string
 *                 example: NodeJS, PostgreSQL, Express

 *               # ✅ SALARY
 *               salaryRange:
 *                 type: string
 *                 example: 5-10 LPA
 *               minSalary:
 *                 type: integer
 *                 example: 500000
 *               maxSalary:
 *                 type: integer
 *                 example: 1000000
 *               currency:
 *                 type: string
 *                 example: INR

 *               deadline:
 *                 type: string
 *                 format: date
 *                 example: 2026-12-31

 *               hrEmail:
 *                 type: string
 *                 example: hr@dhatvibs.com

 *               hrPhone:
 *                 type: string
 *                 example: "9876543210"

 *     responses:
 *       200:
 *         description: Job reopened successfully
 *       400:
 *         description: Invalid input
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
 *     description: HR can update job details including experience range and salary.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         description: ID or JOB-XXXX of the job
 *         schema:
 *           type: string
 *           example: JOB-2026-021
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
 *                 example: Hyderabad

 *               # ✅ EXPERIENCE RANGE
 *               minExperience:
 *                 type: integer
 *                 example: 1
 *               maxExperience:
 *                 type: integer
 *                 example: 4
 *               experienceLabel:
 *                 type: string
 *                 example: 1-4 years

 *               jobType:
 *                 type: string
 *                 example: Full-time

 *               description:
 *                 type: string
 *                 example: Develop scalable backend APIs

 *               responsibilities:
 *                 type: string
 *                 example: Build APIs, optimize performance

 *               skills:
 *                 type: string
 *                 example: NodeJS, PostgreSQL

 *               # ✅ SALARY
 *               salaryRange:
 *                 type: string
 *                 example: 4-8 LPA
 *               minSalary:
 *                 type: integer
 *                 example: 400000
 *               maxSalary:
 *                 type: integer
 *                 example: 800000
 *               currency:
 *                 type: string
 *                 example: INR

 *               deadline:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-30

 *               hrEmail:
 *                 type: string
 *                 example: hr@dhatvibs.com

 *               hrPhone:
 *                 type: string
 *                 example: "9876543210"

 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         description: Invalid input
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