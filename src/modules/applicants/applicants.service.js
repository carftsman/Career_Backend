const prisma = require("../../prisma");

//  MONTH PARSER
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

//  EXPERIENCE PARSER (1, 2-5, 3+)
const parseExperience = (experience) => {
  if (!experience || experience === "Any Experience") return null;

  if (experience.includes("+")) {
    return { gte: Number(experience.replace("+", "")) };
  }

  if (experience.includes("-")) {
    const [min, max] = experience.split("-").map(Number);
    return { gte: min, lte: max };
  }

  const val = Number(experience);
  if (!isNaN(val)) return { equals: val };

  return null;
};

//  NORMALIZE SKILLS 
const normalizeSkills = (skills) => {
  if (!skills) return [];

  // already array
  if (Array.isArray(skills)) return skills;

  // postgres string "{NodeJS,React}"
  if (typeof skills === "string") {
    return skills
      .replace(/[{}]/g, "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  return [];
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

  //  JOB CODE
  if (jobCode) {
    const job = await prisma.job.findUnique({
      where: { jobId: jobCode }
    });

    if (!job) {
      return { data: [], total: 0, page: Number(page), limit: Number(limit) };
    }

    AND.push({ jobId: job.id });
  }

  //  SEARCH
  if (search) {
    AND.push({
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    });
  }

  //  EXPERIENCE
  const expFilter = parseExperience(experience);
  if (expFilter) {
    AND.push({ totalExperience: expFilter });
  }

  //  JOB TITLE
  if (jobTitle) {
    AND.push({
      job: {
        title: { contains: jobTitle, mode: "insensitive" }
      }
    });
  }

  //  LOCATION
  if (location) {
    AND.push({
      OR: [
        { city: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } },
        { country: { contains: location, mode: "insensitive" } }
      ]
    });
  }

  //  MONTH + YEAR
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
      createdAt: { gte: startDate, lte: endDate }
    });
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  //  FETCH ALL (NO LIMIT HERE)
  const applications = await prisma.application.findMany({
    where,
    include: {
      candidate: true,
      job: true
    },
    orderBy: { createdAt: "desc" }
  });

  //  SKILL FILTER (FIXED)
  let filteredApplications = applications;

  if (skills && skills !== "All Skills") {
    const skillFilter = skills.toLowerCase().trim();

    filteredApplications = applications.filter(app => {
      const skillArray = normalizeSkills(app.skills);

      return skillArray.some(s =>
        s.toLowerCase().includes(skillFilter)
      );
    });
  }

  // TOTAL AFTER FILTER
  const total = filteredApplications.length;

  // PAGINATION AFTER FILTER
  const skip = (page - 1) * limit;

  const paginated = filteredApplications.slice(
    skip,
    skip + Number(limit)
  );

  // RESPONSE
  const data = paginated.map(a => ({
    id: a.id,
    name: `${a.firstName} ${a.lastName}`,
    email: a.email,
    phone: a.phone,
    jobTitle: a.job.title,
    jobCode: a.job.jobId,
    experience: a.totalExperience,
    skills: normalizeSkills(a.skills),
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