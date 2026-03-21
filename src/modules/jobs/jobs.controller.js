const prisma = require("../../prisma");
const jobsService = require("./jobs.service");


exports.getJobs = async (req, res) => {

  try {

    const { status, search } = req.query;

    const jobs = await jobsService.getJobs(status, search);

    res.json({ jobs });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

  }

};


exports.getJobById = async (req, res) => {
  try {
    const jobParam = req.params.jobId;

    const job = await jobsService.getJobById(jobParam);

    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    const now = new Date();

    const isExpired =
      job.deadline && new Date(job.deadline) < now;

    //  return same object + displayStatus
    res.json({
      ...job, //  keep everything same

      displayStatus: isExpired
        ? "DEADLINE_PASSED"
        : job.status
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
};


exports.createJob = async (req, res) => {
  try {

    const {
      title,
      department,
      location,
      experience,
      jobType,
      description,
      responsibilities,
      skills,
      deadline,
      hrEmail,
      hrPhone
    } = req.body;

    const createdById = req.user.id;

    //  REQUIRED FIELDS
    if (
      !title ||
      !department ||
      !location ||
      !experience ||
      !jobType ||
      !description ||
      !skills ||
      !deadline ||
      !hrEmail ||
      !hrPhone
    ) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    //  HR EMAIL VALIDATION
    if (!hrEmail.endsWith("@dhatvibs.com")) {
      return res.status(400).json({
        message: "HR email must be from @dhatvibs.com domain"
      });
    }

    // PHONE VALIDATION
    if (!/^[0-9]{10}$/.test(hrPhone)) {
      return res.status(400).json({
        message: "Phone must be 10 digits"
      });
    }

    //  DEADLINE VALIDATION
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate <= today) {
      return res.status(400).json({
        message: "Deadline must be a future date"
      });
    }

    //  LOCATION VALIDATION
    const INVALID_LOCATIONS = ["Remote", "Full-time"];
    if (INVALID_LOCATIONS.includes(location)) {
      return res.status(400).json({
        message: "Location cannot be Remote or Full-time"
      });
    }

    //  JOB TYPE VALIDATION
    const ALLOWED_JOB_TYPES = ["Full-time", "Remote", "Hybrid"];
    if (!ALLOWED_JOB_TYPES.includes(jobType)) {
      return res.status(400).json({
        message: "Invalid job type"
      });
    }

    //  SKILLS ARRAY HANDLING (Prisma String[])
    let skillsArray;

    if (Array.isArray(skills)) {
      skillsArray = skills;
    } else {
      skillsArray = skills.split(",").map(s => s.trim());
    }

    //  AUTO JOB ID + DUPLICATE SAFE (RETRY LOGIC)
    let created = false;
    let job;

    while (!created) {
      try {

        const year = new Date().getFullYear();

        const lastJob = await prisma.job.findFirst({
          orderBy: { id: "desc" }
        });

        let nextNumber = 1;

        if (lastJob && lastJob.jobId) {
          const lastNumber = parseInt(lastJob.jobId.split("-").pop());
          nextNumber = lastNumber + 1;
        }

        const finalJobId = `JOB-${year}-${String(nextNumber).padStart(3, "0")}`;

        job = await jobsService.createJob({
          jobId: finalJobId,
          title,
          department,
          location,
          experience: Number(experience),
          jobType,
          description,
          responsibilities: responsibilities || null,
          skills: skillsArray,
          deadline: deadlineDate,
          hrEmail,
          hrPhone,
          status: "ACTIVE",
          createdById
        });

        created = true;

      } catch (error) {

        //  Retry if duplicate jobId
        if (error.code === "P2002") {
          continue;
        }

        throw error;
      }
    }

    res.status(201).json({
      message: "Job created successfully",
      job
    });

  } catch (error) {

    console.error("CREATE JOB ERROR:", error);

    res.status(500).json({
      message: "Internal server error"
    });

  }
};


exports.closeJob = async (req, res) => {

  try {

    const jobId = Number(req.params.jobId);

    const job = await jobsService.closeJob(jobId);

    res.json({
      message: "Job closed successfully",
      job
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

  }

};


exports.reopenJob = async (req, res) => {
  try {

    const jobId = Number(req.params.jobId);

    const {
      title,
      department,
      location,
      experience,
      jobType,
      description,
      responsibilities,
      skills,
      deadline,
      hrEmail,
      hrPhone
    } = req.body;

    //  Find existing job
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!existingJob) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    //  SKILLS handling (array)
    let skillsArray;

    if (skills) {
      skillsArray = Array.isArray(skills)
        ? skills
        : skills.split(",").map(s => s.trim());
    }

    //  DEADLINE validation (if provided)
    let deadlineDate;

    if (deadline) {
      deadlineDate = new Date(deadline);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate <= today) {
        return res.status(400).json({
          message: "Deadline must be future date"
        });
      }
    }

    // Update job (NO new jobId)
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: title || existingJob.title,
        department: department || existingJob.department,
        location: location || existingJob.location,
        experience: experience ? Number(experience) : existingJob.experience,
        jobType: jobType || existingJob.jobType,
        description: description || existingJob.description,
        responsibilities: responsibilities ?? existingJob.responsibilities,
        skills: skillsArray || existingJob.skills,
        deadline: deadlineDate || existingJob.deadline,
        hrEmail: hrEmail || existingJob.hrEmail,
        hrPhone: hrPhone || existingJob.hrPhone,

        // 🔥 MAIN POINT
        status: "ACTIVE"
      }
    });

    res.json({
      message: "Job reopened successfully",
      job: updatedJob
    });

  } catch (error) {

    console.error("REOPEN JOB ERROR:", error);

    res.status(500).json({
      message: "Internal server error"
    });

  }
};

exports.updateJob = async (req, res) => {
  try {

    const jobId = Number(req.params.jobId);

    const {
      title,
      department,
      location,
      experience,
      jobType,
      description,
      skills,
      deadline
    } = req.body;

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        title,
        department,
        location,
        experience,
        jobType,
        description,
        skills,
        deadline: new Date(deadline)
      }
    });

    res.json({
      message: "Job updated successfully",
      job
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteJob = async (req, res) => {
  try {

    const jobId = Number(req.params.jobId);

    await prisma.job.delete({
      where: { id: jobId }
    });

    res.json({
      message: "Job deleted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });

  }
};