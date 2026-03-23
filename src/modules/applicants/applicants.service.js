const prisma = require("../../prisma");

//  Month parser
const parseMonth = (month) => {
  if (!month) return null;

  if (!isNaN(month)) {
    const num = Number(month);
    return num >= 1 && num <= 12 ? num : null;
  }

  const monthMap = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12
  };

  return monthMap[month.toLowerCase()] || null;
};

exports.getApplicants = async (filters) => {
  const {
    search,
    skills,
    experience,
    jobCode,
    jobTitle,
    location,
    month,
    year,
    page = 1,
    limit = 10
  } = filters;

  const where = {};
  const AND = [];

  //  Job Code
  if (jobCode) {
    const job = await prisma.job.findUnique({
      where: { jobId: jobCode }
    });

    if (!job) {
      return { data: [], total: 0, page: Number(page), limit: Number(limit) };
    }

    AND.push({ jobId: job.id });
  }

  //  Search
  if (search) {
    AND.push({
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    });
  }

  //  Skills FIX (partial + case-insensitive)
  if (skills && skills !== "All Skills") {
    AND.push({
      OR: [
        {
          skills: {
            has: skills
          }
        },
        {
          skills: {
            has: skills.toLowerCase()
          }
        },
        {
          skills: {
            has: skills.toUpperCase()
          }
        }
      ]
    });
  }

  //  Experience FIX (exact match)
  if (experience && experience !== "Any Experience") {
    const expValue = Number(experience);

    if (!isNaN(expValue)) {
      AND.push({
        totalExperience: {
          equals: expValue
        }
      });
    }
  }

  //  Job Title
  if (jobTitle) {
    AND.push({
      job: {
        title: {
          contains: jobTitle,
          mode: "insensitive"
        }
      }
    });
  }

  //  Location
  if (location) {
    AND.push({
      OR: [
        { city: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } },
        { country: { contains: location, mode: "insensitive" } }
      ]
    });
  }

  //  Month + Year
  const parsedMonth = parseMonth(month);

  if (parsedMonth || year) {
    const startDate = new Date(
      year || new Date().getFullYear(),
      parsedMonth ? parsedMonth - 1 : 0,
      1
    );

    const endDate = new Date(
      year || new Date().getFullYear(),
      parsedMonth ? parsedMonth : 12,
      0
    );

    AND.push({
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    });
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  const skip = (page - 1) * limit;

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