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
 *     description: Candidate applies for a job. If fields are empty, data is auto-filled from profile.
 *     tags: [Candidate Jobs]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         description: Job ID or Job Code
 *         schema:
 *           type: string
 *           example: "24"
 *
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *
 *               firstName:
 *                 type: string
 *                 nullable: true
 *                 example: Sushma
 *
 *               lastName:
 *                 type: string
 *                 nullable: true
 *                 example: Sree
 *
 *               email:
 *                 type: string
 *                 nullable: true
 *                 example: sushma@gmail.com
 *
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "9876543210"
 *
 *               gender:
 *                 type: string
 *                 nullable: true
 *                 example: Female
 *
 *               dob:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2000-02-09"
 *
 *               address:
 *                 type: string
 *                 nullable: true
 *                 example: Hyderabad
 *
 *               city:
 *                 type: string
 *                 nullable: true
 *                 example: Hyderabad
 *
 *               state:
 *                 type: string
 *                 nullable: true
 *                 example: Telangana
 *
 *               country:
 *                 type: string
 *                 nullable: true
 *                 example: India
 *
 *               qualification:
 *                 type: string
 *                 nullable: true
 *                 example: B.Tech
 *
 *               degree:
 *                 type: string
 *                 nullable: true
 *                 example: Computer Science
 *
 *               university:
 *                 type: string
 *                 nullable: true
 *                 example: JNTU
 *
 *               graduationYear:
 *                 type: integer
 *                 nullable: true
 *                 example: 2022
 *
 *               cgpa:
 *                 type: number
 *                 nullable: true
 *                 example: 8.5
 *
 *               totalExperience:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *
 *               currentCompany:
 *                 type: string
 *                 nullable: true
 *                 example: Cognizant
 *
 *               currentRole:
 *                 type: string
 *                 nullable: true
 *                 example: Developer
 *
 *               previousCompanies:
 *                 type: string
 *                 nullable: true
 *                 example: TCS
 *
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["NodeJS", "React"]
 *
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["AWS", "Azure"]
 *
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["English", "Hindi"]
 *
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Upload resume (optional)
 *
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