const prisma = require("../../prisma");
const uploadToAzure = require("../../cloud/azureUpload");

exports.getJobs = async (req, res) => {

  try {

    const { search, department, location, experience, jobType } = req.query;

    const where = {
      status: "ACTIVE"
    };

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive"
      };
    }

    if (department) {
      where.department = department;
    }

    if (location) {
      where.location = location;
    }

    if (experience) {
      where.experience = Number(experience);
    }

    if (jobType) {
      where.jobType = jobType;
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({ jobs });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch jobs"
    });

  }

};

exports.getJobDetails = async (req, res) => {

  try {

    const jobId = Number(req.params.jobId);

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    res.json(job);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch job"
    });

  }

};

exports.saveJob = async (req, res) => {

  try {

    const candidateId = req.user.id;
    const jobId = Number(req.params.jobId);

    const saved = await prisma.savedJob.create({
      data: {
        candidateId,
        jobId
      }
    });

    res.json({
      message: "Job saved successfully"
    });

  } catch (error) {

    if (error.code === "P2002") {
      return res.json({
        message: "Job already saved"
      });
    }

    res.status(500).json({
      message: "Failed to save job"
    });

  }

};


exports.applyJob = async (req, res) => {

  try {

    const candidateId = req.user.id;
    const jobId = Number(req.params.jobId);

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found"
      });
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        candidateId,
        jobId
      }
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You already applied for this job"
      });
    }

    const file = req.file;
    let resumeUrl = candidate.resumeUrl;

    if (file) {

      const fileName = `resume-${candidateId}-${Date.now()}-${file.originalname}`;

      resumeUrl = await uploadToAzure(file.buffer, fileName);

    }

    const application = await prisma.application.create({

      data: {

        candidateId,
        jobId,

        // PERSONAL INFORMATION
        firstName: req.body.firstName || candidate.firstName,
        lastName: req.body.lastName || candidate.lastName,
        email: req.body.email || candidate.email,
        phone: req.body.phone || candidate.phone,
        gender: req.body.gender,
        dob: req.body.dob ? new Date(req.body.dob) : null,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,

        // EDUCATION
        qualification: req.body.qualification,
        degree: req.body.degree,
        university: req.body.university,
        graduationYear: req.body.graduationYear
          ? Number(req.body.graduationYear)
          : null,
        cgpa: req.body.cgpa
          ? Number(req.body.cgpa)
          : null,

        // EXPERIENCE
        totalExperience: req.body.totalExperience
          ? Number(req.body.totalExperience)
          : null,
        currentCompany: req.body.currentCompany,
        currentRole: req.body.currentRole,
        previousCompanies: req.body.previousCompanies,
        achievements: req.body.achievements,

        // ADDITIONAL INFO
        skills: req.body.skills || candidate.skills,
        certifications: req.body.certifications,
        languages: req.body.languages,

        resumeUrl

      }

    });

    res.status(201).json({
      message: "Application submitted successfully",
      application
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to submit application"
    });

  }

};

exports.getSavedJobs = async (req, res) => {

  try {

    const candidateId = req.user.id;

    const savedJobs = await prisma.savedJob.findMany({

      where: {
        candidateId
      },

      include: {
        job: true
      }

    });

    const jobs = savedJobs.map(s => s.job);

    res.json({ jobs });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch saved jobs"
    });

  }

};

exports.removeSavedJob = async (req, res) => {

  try {

    const candidateId = req.user.id;
    const jobId = Number(req.params.jobId);

    await prisma.savedJob.deleteMany({

      where: {
        candidateId,
        jobId
      }

    });

    res.json({
      message: "Job removed from saved list"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to remove saved job"
    });

  }

};