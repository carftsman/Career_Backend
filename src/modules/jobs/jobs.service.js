const prisma = require("../../prisma");

exports.getJobs = async (filters) => {

  const {
    status,
    search,
    minExperience,
    maxExperience,
    minSalary,
    maxSalary
  } = filters;

  const now = new Date();

  //  AUTO CLOSE EXPIRED JOBS
  await prisma.job.updateMany({
    where: {
      deadline: { lt: now },
      status: "ACTIVE"
    },
    data: { status: "CLOSED" }
  });

  const where = {};
  const AND = [];

  //  STATUS
  if (status) {
    AND.push({ status });
  }

  //  EXPERIENCE FILTER
  if (minExperience || maxExperience) {
    AND.push({
      AND: [
        minExperience
          ? { minExperience: { gte: Number(minExperience) } }
          : {},
        maxExperience
          ? { maxExperience: { lte: Number(maxExperience) } }
          : {}
      ]
    });
  }

  //  SALARY FILTER
  if (minSalary || maxSalary) {
    AND.push({
      AND: [
        minSalary
          ? { minSalary: { gte: Number(minSalary) } }
          : {},
        maxSalary
          ? { maxSalary: { lte: Number(maxSalary) } }
          : {}
      ]
    });
  }

  //  SEARCH (DB LEVEL for performance)
  if (search) {
    AND.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    });
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true }
      }
    }
  });

  //  SKILLS PARTIAL FILTER (POST PROCESS)
  let filtered = jobs;

  if (search) {
    const s = search.toLowerCase();

    filtered = jobs.filter(job =>
      job.title.toLowerCase().includes(s) ||
      job.department.toLowerCase().includes(s) ||
      job.description.toLowerCase().includes(s) ||
      job.skills.some(skill =>
        skill.toLowerCase().includes(s)
      )
    );
  }

  //  RESPONSE FORMAT
  return filtered.map(job => {

    const isExpired =
      job.deadline && new Date(job.deadline) < now;

    return {
      id: job.id,

      jobId: job.jobId
        ? `#${job.jobId}`
        : `#JOB-${job.id}`,

      title: job.title,
      department: job.department,
      location: job.location,

      //  EXPERIENCE
      minExperience: job.minExperience,
      maxExperience: job.maxExperience,
      experienceLabel: job.experienceLabel,

      jobType: job.jobType,

      //  STATUS
      status: job.status,
      displayStatus: isExpired
        ? "DEADLINE_PASSED"
        : job.status,

      applicants: job._count.applications,

      //  SALARY
      salaryRange: job.salaryRange,
      minSalary: job.minSalary,
      maxSalary: job.maxSalary,
      currency: job.currency,

      postedDate: job.createdAt,
      deadline: job.deadline
    };
  });
};

exports.createJob = async (data) => {

  return prisma.job.create({
    data
  });

};


exports.closeJob = async (jobId) => {

  return prisma.job.update({
    where: { id: jobId },
    data: { status: "CLOSED" }
  });

};


exports.reopenJob = async (jobId) => {

  return prisma.job.update({
    where: { id: jobId },
    data: { status: "ACTIVE" }
  });

};

exports.getJobById = async (jobParam) => {

  let job;

  // Support both id & JOB-XXXX
  if (!isNaN(jobParam)) {
    job = await prisma.job.findUnique({
      where: { id: Number(jobParam) },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });
  } else {
    job = await prisma.job.findUnique({
      where: { jobId: jobParam },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });
  }

  return job;
};