const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../prisma");
const uploadToAzure = require("../../cloud/azureUpload");
const candidateService = require("./candidate.service");

exports.signup = async (req, res) => {
  try {

    const { firstName, lastName, email, phone,dob, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    const existingUser = await candidateService.findCandidateByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const candidate = await candidateService.createCandidate({
      firstName,
      lastName,
      email,
      phone,
      dob: new Date(dob),
      password: hashedPassword
    });

    res.status(201).json({
      message: "Candidate registered successfully",
      candidate
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });

  }
};

exports.updateBasicDetails = async (req, res) => {
  try {

    const { candidateId, location, skills } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        message: "candidateId is required"
      });
    }

    let resumeUrl = null;

    if (req.file) {
      const fileName = `resume-${candidateId}-${Date.now()}-${req.file.originalname}`;
      resumeUrl = await uploadToAzure(req.file.buffer, fileName);
    }

    const candidate = await prisma.candidate.update({
      where: { id: Number(candidateId) },
      data: {
        location,
        skills,
        resumeUrl
      }
    });

    res.json({
      message: "Registration completed",
      candidate
    });

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const candidate = await candidateService.findCandidateByEmail(email);

    if (!candidate) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, candidate.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { id: candidate.id, role: "CANDIDATE" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      candidate
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });

  }
};

exports.getProfile = async (req, res) => {

  try {

    const candidateId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found"
      });
    }

    res.json({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      skills: candidate.skills,
      resumeUrl: candidate.resumeUrl
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch profile"
    });

  }

};