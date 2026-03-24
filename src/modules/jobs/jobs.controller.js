const prisma = require("../../prisma");
const jobsService = require("./jobs.service");


exports.getJobs = async (req, res) => {
  try {
    const filters = req.query;   // GET QUERY PARAMS

    const jobs = await jobsService.getJobs(filters);

    res.json({
      jobs
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });
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

const parseExperience = (exp) => {
  if (!exp) return {};

  const clean = exp.toString().toLowerCase().trim();

  // 3+
  if (clean.includes("+")) {
    const min = parseInt(clean.replace("+", ""));
    return {
      minExperience: min,
      maxExperience: null,
      experienceLabel: `${min}+ years`
    };
  }

  // 2-5
  if (clean.includes("-")) {
    const [min, max] = clean.split("-").map(Number);
    return {
      minExperience: min,
      maxExperience: max,
      experienceLabel: `${min}-${max} years`
    };
  }

  // single value
  const val = Number(clean);
  return {
    minExperience: val,
    maxExperience: val,
    experienceLabel: `${val} years`
  };
};


//  SALARY PARSER
const parseSalary = (salaryRange) => {
  if (!salaryRange) return {};

  const cleaned = salaryRange.toLowerCase().replace(/,/g, "");
  const numbers = cleaned.match(/\d+/g);

  if (!numbers || numbers.length < 2) return {};

  let min = Number(numbers[0]);
  let max = Number(numbers[1]);

  // convert LPA → INR
  if (cleaned.includes("lpa")) {
    min *= 100000;
    max *= 100000;
  }

  return {
    minSalary: min,
    maxSalary: max,
    currency: "INR"
  };
};

//  EXPERIENCE LABEL GENERATOR
const generateExperienceLabel = (min, max) => {
  if (min != null && max != null) {
    return `${min}-${max} years`;
  }
  if (min != null) {
    return `${min}+ years`;
  }
  return null;
};

//  SALARY RANGE GENERATOR (IN LPA)
const generateSalaryRange = (min, max) => {
  if (min != null && max != null) {
    const minLPA = (min / 100000).toFixed(0);
    const maxLPA = (max / 100000).toFixed(0);
    return `${minLPA}-${maxLPA} LPA`;
  }
  return null;
};

exports.createJob = async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      jobType,
      description,
      responsibilities,
      skills,
      deadline,
      hrEmail,
      hrPhone,

      minExperience,
      maxExperience,
      minSalary,
      maxSalary,
      currency
    } = req.body;

    const createdById = req.user.id;

    //  VALIDATION
    if (
      !title ||
      !department ||
      !location ||
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

    //  FORMAT SKILLS
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills.split(",").map(s => s.trim());

    //  AUTO GENERATE FIELDS
    const experienceLabel = generateExperienceLabel(
      minExperience ? Number(minExperience) : null,
      maxExperience ? Number(maxExperience) : null
    );

    const salaryRange = generateSalaryRange(
      minSalary ? Number(minSalary) : null,
      maxSalary ? Number(maxSalary) : null
    );

    //  JOB ID GENERATION
    const year = new Date().getFullYear();

    const lastJob = await prisma.job.findFirst({
      orderBy: { id: "desc" }
    });

    let nextNumber = 1;

    if (lastJob?.jobId) {
      const lastNumber = parseInt(lastJob.jobId.split("-").pop());
      nextNumber = lastNumber + 1;
    }

    const finalJobId = `JOB-${year}-${String(nextNumber).padStart(3, "0")}`;

    //  CREATE JOB
    const job = await prisma.job.create({
      data: {
        jobId: finalJobId,
        title,
        department,
        location,
        jobType,
        description,
        responsibilities: responsibilities || null,
        skills: skillsArray,
        deadline: new Date(deadline),

        hrEmail,
        hrPhone,

        //  EXPERIENCE
        minExperience: minExperience ? Number(minExperience) : null,
        maxExperience: maxExperience ? Number(maxExperience) : null,
        experienceLabel,

        //  SALARY
        minSalary: minSalary ? Number(minSalary) : null,
        maxSalary: maxSalary ? Number(maxSalary) : null,
        salaryRange,
        currency: currency || "INR",

        status: "ACTIVE",
        createdById
      }
    });

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
    const body = req.body;

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!existingJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    // ✅ EXPERIENCE FIX
    const expData = body.experience
      ? parseExperience(body.experience)
      : {};

    // ✅ SKILLS
    const skillsArray = body.skills
      ? (Array.isArray(body.skills)
          ? body.skills
          : body.skills.split(",").map(s => s.trim()))
      : undefined;

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: body.title || existingJob.title,
        department: body.department || existingJob.department,
        location: body.location || existingJob.location,

        ...expData,

        jobType: body.jobType || existingJob.jobType,
        description: body.description || existingJob.description,
        responsibilities: body.responsibilities ?? existingJob.responsibilities,
        skills: skillsArray || existingJob.skills,

        deadline: body.deadline
          ? new Date(body.deadline)
          : existingJob.deadline,

        hrEmail: body.hrEmail || existingJob.hrEmail,
        hrPhone: body.hrPhone || existingJob.hrPhone,

        status: "ACTIVE"
      }
    });

    res.json({
      message: "Job reopened successfully",
      job: updatedJob
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const jobParam = req.params.jobId;
    const body = req.body;

    let job;

    // ✅ FIND JOB (IMPORTANT FIX)
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
      return res.status(404).json({
        message: "Job not found"
      });
    }

    // ✅ SKILLS PARSER
    const skillsArray = body.skills
      ? (Array.isArray(body.skills)
          ? body.skills
          : body.skills.split(",").map(s => s.trim()))
      : undefined;

    // ✅ UPDATE DATA
    const updateData = {
      title: body.title || undefined,
      department: body.department || undefined,
      location: body.location || undefined,
      jobType: body.jobType || undefined,
      description: body.description || undefined,
      responsibilities: body.responsibilities || undefined,

      // EXPERIENCE
      minExperience: body.minExperience
        ? Number(body.minExperience)
        : undefined,

      maxExperience: body.maxExperience
        ? Number(body.maxExperience)
        : undefined,

      experienceLabel: body.experienceLabel || undefined,

      // SALARY
      salaryRange: body.salaryRange || undefined,
      minSalary: body.minSalary
        ? Number(body.minSalary)
        : undefined,
      maxSalary: body.maxSalary
        ? Number(body.maxSalary)
        : undefined,
      currency: body.currency || undefined,

      skills: skillsArray,

      deadline: body.deadline
        ? new Date(body.deadline)
        : undefined,

      hrEmail: body.hrEmail || undefined,
      hrPhone: body.hrPhone || undefined
    };

    // ✅ REMOVE UNDEFINED FIELDS
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    // ✅ UPDATE USING CORRECT ID
    const updatedJob = await prisma.job.update({
      where: { id: job.id }, // ✅ FIXED
      data: updateData
    });

    res.json({
      message: "Job updated successfully",
      job: updatedJob
    });

  } catch (error) {
    console.error("UPDATE JOB ERROR:", error);

    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
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