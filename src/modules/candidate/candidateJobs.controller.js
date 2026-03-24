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
      orderBy: { createdAt: "desc" }
    });

    //  FORMAT RESPONSE
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      jobId: job.jobId,
      title: job.title,
      department: job.department,
      location: job.location,
      jobType: job.jobType,

      //  ADD CREATED DATE
      createdAt: job.createdAt,

      // OPTIONAL (better UI)
      postedDate: job.createdAt.toISOString(),

      deadline: job.deadline,
      salary: job.salaryRange,
      experience: job.experienceLabel
    }));

    res.json({ jobs: formattedJobs });

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
    const jobParam = req.params.jobId;

    let job;

    //  Support both numeric ID & jobCode
    if (!isNaN(jobParam)) {
      job = await prisma.job.findUnique({
        where: { id: Number(jobParam) }
      });
    } else {
      job = await prisma.job.findUnique({
        where: { jobId: jobParam }
      });
    }

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status === "CLOSED") {
      return res.status(400).json({ message: "This job is closed" });
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        message: "Application deadline has passed"
      });
    }

    const jobId = job.id;

    const existingApplication = await prisma.application.findFirst({
      where: { candidateId, jobId }
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You already applied for this job"
      });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { profile: true }
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const profile = candidate.profile || {};
    const body = req.body;
    const file = req.file;

    //  Resume upload
    let resumeUrl = candidate.resumeUrl || null;

    if (file) {
      const fileName = `resume-${candidateId}-${Date.now()}-${file.originalname}`;
      resumeUrl = await uploadToAzure(file.buffer, fileName);
    }

    //  STRING CLEANER
    const safeValue = (val) => {
      return val && val !== "string" && val !== "" ? val : null;
    };

    //  NUMBER CLEANER
    const safeNumber = (val, fallback) => {
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        val === "string"
      ) {
        return fallback ?? null;
      }

      const num = Number(val);
      return isNaN(num) ? fallback ?? null : num;
    };

    //  ARRAY PARSER
    const parseArray = (field) => {
      if (!field || field === "string") return [];
      if (Array.isArray(field)) return field;
      return field.split(",").map((s) => s.trim());
    };

    //  FINAL DATA
    const applicationData = {
      candidate: {
        connect: { id: candidateId }
      },
      job: {
        connect: { id: jobId }
      },

      // BASIC
      firstName: safeValue(body.firstName) ?? candidate.firstName,
      lastName: safeValue(body.lastName) ?? candidate.lastName,
      email: safeValue(body.email) ?? candidate.email,
      phone: safeValue(body.phone) ?? candidate.phone,

      // PERSONAL
      gender: safeValue(body.gender) ?? safeValue(profile.gender),
      dob: body.dob
        ? new Date(body.dob)
        : profile.dob || null,

      // ADDRESS
      address: safeValue(body.address) ?? safeValue(profile.address),
      city: safeValue(body.city) ?? safeValue(profile.city),
      state: safeValue(body.state) ?? safeValue(profile.state),
      country: safeValue(body.country) ?? safeValue(profile.country),

      // EDUCATION
      qualification:
        safeValue(body.qualification) ?? safeValue(profile.qualification),
      degree:
        safeValue(body.degree) ?? safeValue(profile.degree),
      university:
        safeValue(body.university) ?? safeValue(profile.university),

      graduationYear: safeNumber(
        body.graduationYear,
        profile.graduationYear
      ),

      cgpa: safeNumber(body.cgpa, profile.cgpa),

      // EXPERIENCE
      totalExperience: safeNumber(
        body.totalExperience,
        profile.totalExperience
      ),

      currentCompany:
        safeValue(body.currentCompany) ??
        safeValue(profile.currentCompany),

      currentRole:
        safeValue(body.currentRole) ??
        safeValue(profile.currentRole),

      previousCompanies:
        safeValue(body.previousCompanies) ??
        safeValue(profile.previousCompanies),

      achievements: safeValue(body.achievements),

      // ARRAYS
      skills: body.skills
        ? parseArray(body.skills)
        : profile.skills ?? [],

      certifications: body.certifications
        ? parseArray(body.certifications)
        : [],

      languages: body.languages
        ? parseArray(body.languages)
        : profile.languages ?? [],

      // FILE
      resumeUrl,

      status: "APPLIED"
    };

    const application = await prisma.application.create({
      data: applicationData
    });

    res.status(200).json({
      message: "Application submitted successfully",
      application
    });

  } catch (error) {
    console.error("APPLY ERROR:", error);

    res.status(500).json({
      message: "Failed to submit application",
      error: error.message
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

exports.getMyApplications = async (req, res) => {
  try {
    const candidateId = req.user.id;

    const applications = await prisma.application.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
      include: {
        job: true
      }
    });

    const formatted = applications.map(app => ({
      applicationId: app.id,

      jobId: app.job.jobId || `JOB-${app.job.id}`,
      title: app.job.title,
      department: app.job.department,
      location: app.job.location,

      appliedDate: app.createdAt
    }));

    res.json({
      count: formatted.length,
      applications: formatted
    });

  } catch (error) {
    console.error("MY APPLICATIONS ERROR:", error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
};