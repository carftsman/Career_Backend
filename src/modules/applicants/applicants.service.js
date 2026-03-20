const prisma = require("../../prisma");

exports.getApplicants = async (filters) => {
  const {
    search,
    skills,
    experience,
    jobCode,
    location,
    month,
    year,
    page = 1,
    limit = 10
  } = filters;

  const where = {};

  //  Job Code filter (#JOB-2026-015)
  if (jobCode) {
    const job = await prisma.job.findUnique({
      where: { jobId: jobCode }
    });

    if (!job) {
      return { data: [], total: 0, page: Number(page), limit: Number(limit) };
    }

    where.jobId = job.id;
  }

  //  Search (name/email)
  if (search) {
    where.OR = [
      {
        candidate: {
          firstName: { contains: search, mode: "insensitive" }
        }
      },
      {
        candidate: {
          lastName: { contains: search, mode: "insensitive" }
        }
      },
      {
        candidate: {
          email: { contains: search, mode: "insensitive" }
        }
      }
    ];
  }

  //  Skills filter
  if (skills && skills !== "All Skills") {
    where.skills = {
      contains: skills,
      mode: "insensitive"
    };
  }

  //  Experience filter
  if (experience && experience !== "Any Experience") {
    const expValue = parseInt(experience);
    if (!isNaN(expValue)) {
      where.totalExperience = {
        gte: expValue
      };
    }
  }

  //  Location filter
  if (location) {
    where.OR = [
      { city: { contains: location, mode: "insensitive" } },
      { state: { contains: location, mode: "insensitive" } },
      { country: { contains: location, mode: "insensitive" } }
    ];
  }

  //  Date filter (month + year)
  if (month || year) {
    const startDate = new Date(
      year || new Date().getFullYear(),
      month ? month - 1 : 0,
      1
    );

    const endDate = new Date(
      year || new Date().getFullYear(),
      month ? month : 12,
      0
    );

    where.createdAt = {
      gte: startDate,
      lte: endDate
    };
  }

  // Pagination
  const skip = (page - 1) * limit;

  //  Query
  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        candidate: true,
        job: true
      },
      orderBy: { createdAt: "desc" },
      skip: Number(skip),
      take: Number(limit)
    }),

    prisma.application.count({ where })
  ]);

  //  Response mapping
  const data = applications.map(a => ({
    id: a.id,
    name: `${a.firstName} ${a.lastName}`,
    email: a.email,
    phone: a.phone,
    jobTitle: a.job.title,
    jobCode: a.job.jobId,
    experience: a.totalExperience,
    skills: a.skills,
    location: `${a.city || ""} ${a.country || ""}`,
    resume: a.resumeUrl,
    appliedDate: a.createdAt
  }));

  return {
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit)
  };
};

// exports.getApplicantsByJob = async (jobCode) => {

//   const job = await prisma.job.findUnique({
//     where: { jobId: jobCode }
//   });

//   if (!job) {
//     throw new Error("Job not found");
//   }

//   const applications = await prisma.application.findMany({
//     where: {
//       jobId: job.id   // FK (numeric)
//     },
//     include: {
//       candidate: true,
//       job: true
//     }
//   });

//   return applications.map(a => ({
//     id: a.id,
//     name: `${a.firstName} ${a.lastName}`,
//     email: a.email,
//     phone: a.phone,
//     jobTitle: a.job.title,
//     jobCode: a.job.jobId,
//     experience: a.totalExperience,
//     skills: a.skills,
//     location: `${a.city || ""} ${a.country || ""}`,
//     resume: a.resumeUrl,
//     status: a.status,
//     appliedDate: a.createdAt
//   }));
// };