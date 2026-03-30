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
 *     description: |
 *       Update candidate profile details including personal info, education, experience,
 *       profile photo, and certificates.
 *
 *        IMPORTANT (Frontend Usage Rules):
 *       - skills & languages must be sent as JSON string arrays
 *         Example: '["NodeJS","React"]'
 *       - To CLEAR values → send '[]'
 *       - To KEEP existing values → do NOT send the field
 *
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *
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
 *                 description: Profile photo file
 *
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload multiple certificate files
 *
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: 1998-05-20
 *
 *               gender:
 *                 type: string
 *                 example: Female
 *
 *               address:
 *                 type: string
 *
 *               city:
 *                 type: string
 *
 *               state:
 *                 type: string
 *
 *               country:
 *                 type: string
 *
 *               qualification:
 *                 type: string
 *
 *               degree:
 *                 type: string
 *
 *               university:
 *                 type: string
 *
 *               graduationYear:
 *                 type: integer
 *                 example: 2022
 *
 *               cgpa:
 *                 type: number
 *                 example: 8.5
 *
 *               totalExperience:
 *                 type: integer
 *                 example: 2
 *
 *               currentCompany:
 *                 type: string
 *
 *               currentRole:
 *                 type: string
 *
 *               previousCompanies:
 *                 type: string
 *
 *               skills:
 *                 type: string
 *                 example: '["NodeJS","React"]'
 *                 description: |
 *                   Send as JSON string array.
 *                   - Example: '["NodeJS","React"]'
 *                   - Send '[]' to clear
 *                   - Do not send to keep existing values
 *
 *               languages:
 *                 type: string
 *                 example: '["English","Telugu"]'
 *                 description: |
 *                   Send as JSON string array.
 *                   - Example: '["English","Telugu"]'
 *                   - Send '[]' to clear
 *                   - Do not send to keep existing values
 *
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *
 *       401:
 *         description: Unauthorized
 *
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