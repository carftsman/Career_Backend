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
  if (exp === undefined || exp === null || exp === "") return {};

  const clean = exp.toString().toLowerCase().trim();

  // 3+
  if (clean.includes("+")) {
    const min = parseFloat(clean.replace("+", ""));
    return {
      minExperience: min,
      maxExperience: null,
      experienceLabel: `${min}+ years`
    };
  }

  // 2-5 or 2.5-4.5
  if (clean.includes("-")) {
    const [min, max] = clean.split("-").map(Number);
    return {
      minExperience: min,
      maxExperience: max,
      experienceLabel: `${min}-${max} years`
    };
  }

  // single value (2 or 2.5)
  const val = Number(clean);

  return {
    minExperience: val,
    maxExperience: val,
    experienceLabel: `${val} years`
  };
};


//  SALARY PARSER
const parseSalary = (salaryInput) => {
  if (!salaryInput) return {};

  const cleaned = salaryInput.toString().toLowerCase().replace(/,/g, "").trim();

  // match decimals also
  const numbers = cleaned.match(/\d+(\.\d+)?/g);

  if (!numbers) return {};

  let min = null;
  let max = null;

  if (numbers.length === 1) {
    min = parseFloat(numbers[0]);
  } else {
    min = parseFloat(numbers[0]);
    max = parseFloat(numbers[1]);
  }

  // convert LPA → INR
  if (cleaned.includes("lpa")) {
    min = min != null ? min * 100000 : null;
    max = max != null ? max * 100000 : null;
  }

  return {
    minSalary: min,
    maxSalary: max,
    currency: "INR"
  };
};

//  EXPERIENCE LABEL GENERATOR
const generateExperienceLabel = (min, max) => {
  if (min != null && max != null) return `${min}-${max} years`;
  if (min != null) return `${min}+ years`;
  return null;
};

//  SALARY RANGE GENERATOR (IN LPA)
const generateSalaryRange = (min, max) => {
  if (min != null && max != null) {
    return `${formatSalary(min)} - ${formatSalary(max)}`;
  }

  if (min != null) {
    return `${formatSalary(min)}+`;
  }

  return null;
};

const getEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const formatSalary = (amount) => {
  if (amount == null) return null;

  // Less than 1 lakh
  if (amount < 100000) {
    return `${amount}`;
  }

  // Lakhs (up to < 1 Cr)
  if (amount >= 100000 && amount < 10000000) {
    return `${(amount / 100000).toFixed(1).replace(/\.0$/, "")} LPA`;
  }

  // Crores (>= 1 Cr only)
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `${cr.toFixed(1).replace(/\.0$/, "")} Cr`;
  }

  return `${amount}`;
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

    // VALIDATION
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

    //  CHECK DUPLICATE JOB
    const existingJob = await prisma.job.findFirst({
      where: {
        title: title.trim(),
        department: department.trim(),
        location: location.trim(),
        status: "ACTIVE" // only block active duplicates
      }
    });

    if (existingJob) {
      return res.status(400).json({
        message: "Job already exists for this role, department, and location"
      });
    }

    // SKILLS
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills.split(",").map(s => s.trim());

    // EXPERIENCE PARSE (FIXED)
    const hasMin = minExperience !== undefined && minExperience !== null && minExperience !== "";
    const hasMax = maxExperience !== undefined && maxExperience !== null && maxExperience !== "";

    const expData = parseExperience(
      hasMin && hasMax
        ? `${minExperience}-${maxExperience}`
        : minExperience
    );

    // SALARY PARSE (FIXED)
    const hasMinSalary = minSalary !== undefined && minSalary !== null && minSalary !== "";
    const hasMaxSalary = maxSalary !== undefined && maxSalary !== null && maxSalary !== "";

    let salaryData = {};

    if (typeof minSalary === "number") {
      //  Already INR → DO NOT convert
      salaryData = {
        minSalary: minSalary,
        maxSalary: hasMaxSalary ? maxSalary : null,
        currency: currency || "INR"
      };
    } else {
      //  If string like "2-5 LPA"
      salaryData = parseSalary(
        hasMinSalary && hasMaxSalary
          ? `${minSalary}-${maxSalary}`
          : minSalary
      );
    }

    const experienceLabel = generateExperienceLabel(
      expData.minExperience,
      expData.maxExperience
    );

    const salaryRange = generateSalaryRange(
      salaryData.minSalary,
      salaryData.maxSalary
    );

    // JOB ID GENERATION
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

    // CREATE JOB
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
        deadline: getEndOfDay(deadline),

        hrEmail,
        hrPhone,

        // EXPERIENCE  (0 supported)
        minExperience:
          expData.minExperience !== null && expData.minExperience !== undefined
            ? String(expData.minExperience)
            : null,

        maxExperience:
          expData.maxExperience !== null && expData.maxExperience !== undefined
            ? String(expData.maxExperience)
            : null,
        experienceLabel,

        // SALARY  (decimal supported)
        minSalary: salaryData.minSalary,
        maxSalary: salaryData.maxSalary,
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

    //  EXPERIENCE FIX
    const expData = body.experience
      ? parseExperience(body.experience)
      : {};

    //  SKILLS
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
          ? getEndOfDay(body.deadline)
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

    //  FIND JOB
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

    //  SKILLS PARSER
    const skillsArray = body.skills
      ? (Array.isArray(body.skills)
        ? body.skills
        : body.skills.split(",").map(s => s.trim()))
      : undefined;

    //  SAFE CHECKS (IMPORTANT)
    const hasMinExp =
      body.minExperience !== undefined &&
      body.minExperience !== null &&
      body.minExperience !== "";

    const hasMaxExp =
      body.maxExperience !== undefined &&
      body.maxExperience !== null &&
      body.maxExperience !== "";

    const hasMinSalary =
      body.minSalary !== undefined &&
      body.minSalary !== null &&
      body.minSalary !== "";

    const hasMaxSalary =
      body.maxSalary !== undefined &&
      body.maxSalary !== null &&
      body.maxSalary !== "";

    //  EXPERIENCE LABEL GENERATOR (AUTO FIX)
    const generateExperienceLabel = (min, max) => {
      const format = (val) =>
        Number(val) % 1 === 0 ? Number(val) : val;

      if (min != null && max != null) {
        return `${format(min)}-${format(max)} years`;
      }
      if (min != null) {
        return `${format(min)}+ years`;
      }
      return null;
    };

    //  GENERATE LABEL (DO NOT TRUST FRONTEND)
    const experienceLabel = hasMinExp
      ? generateExperienceLabel(
        Number(body.minExperience),
        hasMaxExp ? Number(body.maxExperience) : null
      )
      : undefined;
    const generateSalaryRange = (min, max) => {
      if (min != null && max != null) {
        return `${formatSalary(min)} - ${formatSalary(max)}`;
      }

      if (min != null) {
        return `${formatSalary(min)}+`;
      }

      return null;
    };

    //  UPDATE DATA
    const updateData = {
      title: body.title || undefined,
      department: body.department || undefined,
      location: body.location || undefined,
      jobType: body.jobType || undefined,
      description: body.description || undefined,
      responsibilities: body.responsibilities || undefined,

      //  EXPERIENCE (STRING FIX + DECIMAL SUPPORT)
      minExperience: hasMinExp ? String(body.minExperience) : undefined,
      maxExperience: hasMaxExp ? String(body.maxExperience) : undefined,
      experienceLabel,

      //  SALARY
      salaryRange: hasMinSalary
        ? generateSalaryRange(
          Number(body.minSalary),
          hasMaxSalary ? Number(body.maxSalary) : null
        )
        : undefined,
      minSalary: hasMinSalary ? Number(body.minSalary) : undefined,
      maxSalary: hasMaxSalary ? Number(body.maxSalary) : undefined,
      currency: body.currency || undefined,

      //  SKILLS
      skills: skillsArray,

      //  DATE
      deadline: body.deadline
        ? getEndOfDay(body.deadline)
        : undefined,

      hrEmail: body.hrEmail || undefined,
      hrPhone: body.hrPhone || undefined
    };

    //  REMOVE UNDEFINED FIELDS
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    //  UPDATE
    const updatedJob = await prisma.job.update({
      where: { id: job.id },
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