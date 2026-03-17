const jobsService = require("./jobs.service");

exports.getJobs = async (req, res) => {

  try {

    const { status , search } = req.query;

    const jobs = await jobsService.getJobs(status , search);

    res.json({ jobs });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

  }

};


exports.getJobById = async (req, res) => {

  try {

    const jobId = Number(req.params.jobId);

    const job = await jobsService.getJobById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

  }

};


exports.createJob = async (req, res) => {
  try {

    const {
      jobId,
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

    //  HR EMAIL DOMAIN VALIDATION
    if (!hrEmail.endsWith("@dhatvibs.com")) {
      return res.status(400).json({
        message: "HR email must be from @dhatvibs.com domain"
      });
    }

    // PHONE VALIDATION
    if (hrPhone.length < 8) {
      return res.status(400).json({
        message: "Invalid phone number"
      });
    }

    //  DEADLINE VALIDATION (FUTURE ONLY)
    const deadlineDate = new Date(deadline);
    const today = new Date();

    if (deadlineDate <= today) {
      return res.status(400).json({
        message: "Deadline must be a future date"
      });
    }

    //  SKILLS ARRAY HANDLING
    let skillsArray;

    if (Array.isArray(skills)) {
      skillsArray = skills;
    } else {
      // convert "NodeJS, React" → ["NodeJS", "React"]
      skillsArray = skills.split(",").map(s => s.trim());
    }

    // GENERATE JOB ID
    let finalJobId = jobId;

    if (!finalJobId) {
      const count = await prisma.job.count();
      finalJobId = `JOB-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
    }

    // CHECK DUPLICATE
    const existingJob = await prisma.job.findUnique({
      where: { jobId: finalJobId }
    });

    if (existingJob) {
      return res.status(400).json({
        message: "Job ID already exists"
      });
    }
    //  LOCATION should not be Remote or Full-time
    const INVALID_LOCATIONS = ["Remote", "Full-time"];

    if (INVALID_LOCATIONS.includes(location)) {
      return res.status(400).json({
        message: "Location cannot be Remote or Full-time"
      });
    }

    //  JOB TYPE validation (allowed values)
    const ALLOWED_JOB_TYPES = ["Full-time", "Remote", "Hybrid"];

    if (!ALLOWED_JOB_TYPES.includes(jobType)) {
      return res.status(400).json({
        message: "Invalid job type"
      });
    }

    // CREATE JOB
    const job = await jobsService.createJob({
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
      status: "ACTIVE",   //  default
      createdById
    });

    res.status(201).json({
      message: "Job created successfully",
      job
    });

  } catch (error) {
    console.error(error);
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

    const job = await jobsService.reopenJob(jobId);

    res.json({
      message: "Job reopened successfully",
      job
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

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