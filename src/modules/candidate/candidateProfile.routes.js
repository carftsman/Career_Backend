const express = require("express");
const router = express.Router();

const candidateProfileController = require("./candidateProfile.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");
const uploadMiddleware = require("../../middlewares/uploadMiddleware");

/**
 * @swagger
 * /api/candidate/profile:
 *   put:
 *     summary: Update candidate profile with photo and certificates
 *     description: Candidate updates profile including personal, education, experience details, profile photo, and multiple certificates upload.
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload multiple certificates
 *               dob:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
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
 *               languages:
 *                 type: string
 *                 example: English, Hindi
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.put(
  "/profile",
  authMiddleware,
  roleMiddleware(["CANDIDATE"]),
  uploadMiddleware.fields([
  { name: "photo", maxCount: 1 },
  { name: "certificates", maxCount: 5 }]),
  candidateProfileController.updateProfile
);
module.exports = router;