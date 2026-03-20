const express = require("express");
const router = express.Router();

const candidateJobsController = require("./candidateJobs.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");
const uploadMiddleware = require("../../middlewares/uploadMiddleware");

/**
 * @swagger
 * /api/candidate/jobs:
 *   get:
 *     summary: Get available jobs for candidates
 *     description: Returns all active jobs posted by HR. Supports filtering by search, department, location, experience, and job type.
 *     tags: [Candidate Jobs]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search jobs by title
 *         example: developer
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *         example: Engineering
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by job location
 *         example: Remote
 *       - in: query
 *         name: experience
 *         schema:
 *           type: integer
 *         description: Required experience in years
 *         example: 3
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *         description: Job type filter
 *         example: Full-time
 *     responses:
 *       200:
 *         description: List of jobs retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/jobs", candidateJobsController.getJobs);


/**
 * @swagger
 * /api/candidate/jobs/{jobId}:
 *   get:
 *     summary: Get job details
 *     description: Returns detailed information about a specific job.
 *     tags: [Candidate Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Job details fetched successfully
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get("/jobs/:jobId", candidateJobsController.getJobDetails);


/**
 * @swagger
 * /api/candidate/jobs/{jobId}/save:
 *   post:
 *     summary: Save job for later
 *     description: Allows a candidate to save a job to their saved jobs list.
 *     tags: [Candidate Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *         example: 3
 *     responses:
 *       200:
 *         description: Job saved successfully
 *       400:
 *         description: Job already saved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/jobs/:jobId/save",
  authMiddleware,
  roleMiddleware(["CANDIDATE"]),
  candidateJobsController.saveJob
);




/**
 * @swagger
 * /api/candidate/jobs/{jobId}/apply:
 *   post:
 *     summary: Apply for a job
 *     description: Candidate applies for a job with auto-filled data from profile. Allows override and resume upload.
 *     tags: [Candidate Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         description: Job ID to apply
 *         schema:
 *           type: string
 *           example: #JOB-2026-001
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               qualification:
 *                 type: string
 *               degree:
 *                 type: string
 *               university:
 *                 type: string
 *               graduationYear:
 *                 type: integer
 *               cgpa:
 *                 type: number
 *               totalExperience:
 *                 type: integer
 *               currentCompany:
 *                 type: string
 *               currentRole:
 *                 type: string
 *               previousCompanies:
 *                 type: string
 *               skills:
 *                 type: string
 *                 example: NodeJS, React
 *               certifications:
 *                 type: string
 *                 example: AWS, Azure
 *               languages:
 *                 type: string
 *                 example: English, Hindi
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Upload resume (optional)
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       400:
 *         description: Already applied or invalid data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */

router.post(
  "/jobs/:jobId/apply",
  authMiddleware,
  roleMiddleware(["CANDIDATE"]),
  uploadMiddleware.single("resume"),
  candidateJobsController.applyJob
);

/**
 * @swagger
 * /api/candidate/saved-jobs:
 *   get:
 *     summary: Get saved jobs
 *     description: Returns jobs saved by the candidate.
 *     tags: [Candidate Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved jobs fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/saved-jobs",
  authMiddleware,
  roleMiddleware(["CANDIDATE"]),
  candidateJobsController.getSavedJobs
);


/**
 * @swagger
 * /api/candidate/saved-jobs/{jobId}:
 *   delete:
 *     summary: Remove saved job
 *     description: Removes a job from candidate saved jobs list.
 *     tags: [Candidate Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 4
 *     responses:
 *       200:
 *         description: Job removed from saved list
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/saved-jobs/:jobId",
  authMiddleware,
  roleMiddleware(["CANDIDATE"]),
  candidateJobsController.removeSavedJob
);

/**
 * @swagger
 * /api/candidate/applications:
 *   get:
 *     summary: Get applied jobs with count
 *     description: Returns total number of jobs applied and job details
 *     tags: [Candidate Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications fetched successfully
 */

router.get(
  "/applications",
  authMiddleware,
  roleMiddleware(["CANDIDATE"]),
  candidateJobsController.getMyApplications
);

module.exports = router;