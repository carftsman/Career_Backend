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



// exports.applyJob = async (req, res) => {
//   try {
//     const candidateId = req.user.id;
//     const jobParam = req.params.jobId;

//     let job;

//     //  Handle both numeric ID and JOB-XXXX
//     if (!isNaN(jobParam)) {
//       job = await prisma.job.findUnique({
//         where: { id: Number(jobParam) }
//       });
//     } else {
//       job = await prisma.job.findUnique({
//         where: { jobId: jobParam }
//       });
//     }

//     //  Job not found
//     if (!job) {
//       return res.status(404).json({
//         message: "Job not found"
//       });
//     }

//     // Prevent applying to CLOSED job
//     if (job.status === "CLOSED") {
//       return res.status(400).json({
//         message: "This job is closed"
//       });
//     }

//     //  Prevent applying after deadline
//     if (job.deadline && new Date(job.deadline) < new Date()) {
//       return res.status(400).json({
//         message: "Application deadline has passed"
//       });
//     }

//     //  Use DB id
//     const jobId = job.id;

//     //  Prevent duplicate application
//     const existingApplication = await prisma.application.findFirst({
//       where: { candidateId, jobId }
//     });

//     if (existingApplication) {
//       return res.status(400).json({
//         message: "You already applied for this job"
//       });
//     }

//     //  Fetch candidate + profile
//     const candidate = await prisma.candidate.findUnique({
//       where: { id: candidateId },
//       include: { profile: true }
//     });

//     if (!candidate) {
//       return res.status(404).json({
//         message: "Candidate not found"
//       });
//     }

//     const profile = candidate.profile || {};
//     const body = req.body;
//     const file = req.file;

//     //  Resume upload
//     let resumeUrl = candidate.resumeUrl || null;

//     if (file) {
//       const fileName = `resume-${candidateId}-${Date.now()}-${file.originalname}`;
//       resumeUrl = await uploadToAzure(file.buffer, fileName);
//     }

//     //  Helper
//     const toArray = (field) => {
//       if (!field) return [];
//       return Array.isArray(field)
//         ? field
//         : field.split(",").map(s => s.trim());
//     };

//     //  FINAL DATA (AUTO-FILL + OVERRIDE)
//     const applicationData = {
//       candidateId,
//       jobId,

//       //  PERSONAL
//       firstName: body.firstName || candidate.firstName,
//       lastName: body.lastName || candidate.lastName,
//       email: body.email || candidate.email,
//       phone: body.phone || candidate.phone,

//       gender: body.gender || profile.gender || null,
//       dob: body.dob
//         ? new Date(body.dob)
//         : profile.dob || null,

//       //  ADDRESS
//       address: body.address || profile.address || null,
//       city: body.city || profile.city || null,
//       state: body.state || profile.state || null,
//       country: body.country || profile.country || null,

//       //  EDUCATION
//       qualification: body.qualification || profile.qualification || null,
//       degree: body.degree || profile.degree || null,
//       university: body.university || profile.university || null,
//       graduationYear: body.graduationYear
//         ? Number(body.graduationYear)
//         : profile.graduationYear || null,
//       cgpa: body.cgpa
//         ? Number(body.cgpa)
//         : profile.cgpa || null,

//       //  EXPERIENCE
//       totalExperience: body.totalExperience
//         ? Number(body.totalExperience)
//         : profile.totalExperience || null,
//       currentCompany: body.currentCompany || profile.currentCompany || null,
//       currentRole: body.currentRole || profile.currentRole || null,
//       previousCompanies:
//         body.previousCompanies || profile.previousCompanies || null,

//       //  SKILLS
//       skills: body.skills
//         ? toArray(body.skills)
//         : profile.skills || [],

//       //  CERTIFICATES (fixed)
//       certifications: body.certifications
//         ? toArray(body.certifications)
//         : profile.certificateUrls || [],

//       //  LANGUAGES
//       languages: body.languages
//         ? toArray(body.languages)
//         : profile.languages || [],

//       //  RESUME
//       resumeUrl,

//       status: "APPLIED"
//     };

//     //  CREATE APPLICATION
//     const application = await prisma.application.create({
//       data: applicationData
//     });

//     res.json({
//       message: "Application submitted successfully",
//       application
//     });

//   } catch (error) {
//     console.error("APPLY ERROR:", error);

//     res.status(500).json({
//       message: "Failed to submit application"
//     });
//   }
// };

exports.applyJob = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const jobParam = req.params.jobId;

    let job;

    //  Support both ID and JOB-XXXX
    if (!isNaN(jobParam)) {
      job = await prisma.job.findUnique({
        where: { id: Number(jobParam) }
      });
    } else {
      job = await prisma.job.findUnique({
        where: { jobId: jobParam }
      });
    }

    // Job not found
    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    //  Prevent closed jobs
    if (job.status === "CLOSED") {
      return res.status(400).json({
        message: "This job is closed"
      });
    }

    //  Prevent expired jobs
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        message: "Application deadline has passed"
      });
    }

    const jobId = job.id;

    //  Prevent duplicate apply
    const existingApplication = await prisma.application.findFirst({
      where: { candidateId, jobId }
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You already applied for this job"
      });
    }

    //  Get candidate + profile
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { profile: true }
    });

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found"
      });
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

    //  Helper: convert array → string
    const toString = (field) => {
      if (!field) return null;
      return Array.isArray(field)
        ? field.join(", ")
        : field;
    };

    //  FINAL DATA (AUTO-FILL + OVERRIDE)
    const applicationData = {
      candidate: {
        connect: { id: candidateId }
      },
      job: {
        connect: { id: jobId }
      },

      // PERSONAL
      firstName: body.firstName || candidate.firstName,
      lastName: body.lastName || candidate.lastName,
      email: body.email || candidate.email,
      phone: body.phone || candidate.phone,

      gender: body.gender || profile.gender || null,
      dob: body.dob ? new Date(body.dob) : profile.dob || null,

      // ADDRESS
      address: body.address || profile.address || null,
      city: body.city || profile.city || null,
      state: body.state || profile.state || null,
      country: body.country || profile.country || null,

      // EDUCATION
      qualification: body.qualification || profile.qualification || null,
      degree: body.degree || profile.degree || null,
      university: body.university || profile.university || null,
      graduationYear: body.graduationYear
        ? Number(body.graduationYear)
        : profile.graduationYear || null,
      cgpa: body.cgpa
        ? Number(body.cgpa)
        : profile.cgpa || null,

      // EXPERIENCE
      totalExperience: body.totalExperience
        ? Number(body.totalExperience)
        : profile.totalExperience || null,
      currentCompany: body.currentCompany || profile.currentCompany || null,
      currentRole: body.currentRole || profile.currentRole || null,
      previousCompanies:
        body.previousCompanies || profile.previousCompanies || null,

      achievements: body.achievements || null,

      // ✅ ARRAY FIELDS (DIRECT)
      skills: body.skills || profile.skills || [],
      certifications: body.certifications || [],
      languages: body.languages || profile.languages || [],

      // RESUME
      resumeUrl,

      status: "APPLIED"
    };

    //  CREATE APPLICATION
    const application = await prisma.application.create({
      data: applicationData
    });

    res.json({
      message: "Application submitted successfully",
      application
    });

  } catch (error) {
    console.error("APPLY ERROR:", error);

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