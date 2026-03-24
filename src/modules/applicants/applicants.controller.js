const { Parser } = require("json2csv");
const prisma = require("../../prisma");
const applicantsService = require("./applicants.service");

exports.getApplicants = async (req, res) => {
  try {
    const result = await applicantsService.getApplicants(req.query);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.exportAllApplicants = async (req, res) => {
  try {

    const applicants = await prisma.application.findMany({
      include: {
        candidate: true,
        job: true
      }
    });

    const formatted = applicants.map(a => ({
      Name: a.candidate.firstName + " " + a.candidate.lastName,
      Email: a.candidate.email,
      Phone: a.candidate.phone,
      JobTitle: a.job.title,
      Experience: a.candidate.experience,
      Skills: a.candidate.skills,
      Location: a.candidate.location,
      Resume: a.candidate.resumeUrl,
      AppliedDate: a.createdAt
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("all_applicants.csv");

    return res.send(csv);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Export failed" });
  }
};

exports.exportSelectedApplicants = async (req, res) => {
  try {

    const { ids } = req.body;

    const applicants = await prisma.application.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        candidate: true,
        job: true
      }
    });

    const formatted = applicants.map(a => ({
      Name: a.candidate.firstName + " " + a.candidate.lastName,
      Email: a.candidate.email,
      Phone: a.candidate.phone,
      JobTitle: a.job.title,
      Experience: a.candidate.experience,
      Skills: a.candidate.skills,
      Location: a.candidate.location,
      Resume: a.candidate.resumeUrl,
      AppliedDate: a.createdAt
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("selected_applicants.csv");

    return res.send(csv);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Export failed" });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    let {
      month,
      year,
      search,
      jobTitle,
      experience,
      location,
      page = 1,
      limit = 10
    } = req.query;

    const now = new Date();

    //  Default month/year
    month = month ? Number(month) : now.getMonth() + 1;
    year = year ? Number(year) : now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    //  BASE WHERE
    let where = {
      createdAt: {
        gte: startDate,
        lt: endDate
      }
    };

    //  SEARCH (name/email/skills)
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { skills: { contains: search, mode: "insensitive" } }
      ];
    }

    //  EXPERIENCE FILTER
    if (experience) {
      where.totalExperience = {
        gte: Number(experience)
      };
    }

    //  LOCATION FILTER
    if (location && location !== "Global") {
      where.OR = [
        ...(where.OR || []),
        { city: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } },
        { country: { contains: location, mode: "insensitive" } }
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: true
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * Number(limit),
      take: Number(limit)
    });

    //  FILTER BY JOB TITLE (after include)
    let filtered = applications;

    if (jobTitle && jobTitle !== "All Jobs") {
      filtered = applications.filter(app =>
        app.job?.title?.toLowerCase().includes(jobTitle.toLowerCase())
      );
    }

    //  FORMAT (UI EXACT)
    const formatted = filtered.map(app => ({
      applicationId: app.id,

      name: `${app.firstName} ${app.lastName}`,

      contactInfo: {
        email: app.email,
        phone: app.phone
      },

      exp: app.totalExperience
        ? `${app.totalExperience} years`
        : "N/A",

      skills: app.skills
        ? app.skills.split(",").map(s => s.trim())
        : [],

      location:
        [app.city, app.state, app.country]
          .filter(Boolean)
          .join(", ") || app.candidate?.location || "N/A",

      resume: app.resumeUrl,

      appliedDate: app.createdAt
    }));

    //  TOTAL COUNT (for UI top card)
    const totalApplicants = await prisma.application.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    res.json({
      month,
      year,
      totalApplicants, 
      results: formatted.length,
      page: Number(page),
      applicants: formatted
    });

  } catch (error) {
    console.error("MONTHLY REPORT ERROR:", error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.getCandidates = async (req, res) => {
  try {

    const { search, location, skills, page = 1, limit = 10 } = req.query;

    const filters = {};

    if (search) {
      filters.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    if (location) {
      filters.location = {
        contains: location,
        mode: "insensitive"
      };
    }

    if (skills) {
      filters.skills = {
        contains: skills,
        mode: "insensitive"
      };
    }

    const candidates = await prisma.candidate.findMany({
      where: filters,
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: "desc" }
    });

    const total = await prisma.candidate.count({ where: filters });

    // Transform response for UI
    const formatted = candidates.map(c => ({
      id: c.id,

      candidate: `${c.firstName} ${c.lastName}`,   //full name

      contactInfo: {
        email: c.email,
        phone: c.phone
      },

      skills: c.skills,
      location: c.location,
      createdAt: c.createdAt,
      resumeUrl: c.resumeUrl
    }));

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: formatted
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch candidates" });
  }
};

exports.getResume = async (req, res) => {
  try {

    const id = Number(req.params.id);

    const candidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!candidate || !candidate.resumeUrl) {
      return res.status(404).json({
        message: "Resume not found"
      });
    }

    res.json({
      resumeUrl: candidate.resumeUrl
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching resume" });
  }
};

exports.getApplicantsByJob = async (req, res) => {
  try {
    const jobParam = req.params.jobId;

    let {
      search,
      skills,
      experience,
      location,
      month,
      year,
      page = 1,
      limit = 10
    } = req.query;

    let job;

    //  Find job (ID or jobCode)
    if (!isNaN(jobParam)) {
      job = await prisma.job.findUnique({
        where: { id: Number(jobParam) }
      });
    }

    if (!job) {
      job = await prisma.job.findUnique({
        where: { jobId: jobParam }
      });
    }

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    //  Month parser
    const parseMonth = (month) => {
      if (!month) return null;

      if (!isNaN(month)) return Number(month);

      const map = {
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

      return map[month.toLowerCase()] || null;
    };

    const parsedMonth = parseMonth(month);

    //  WHERE CONDITIONS
    const AND = [];

    //  Always filter by job
    AND.push({ jobId: job.id });

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

    //  EXPERIENCE FILTER (Improved)
    if (experience && experience !== "Any Experience") {
      if (experience.includes("-")) {
        // Range (e.g., "2-5")
        const [min, max] = experience.split("-").map(Number);

        AND.push({
          totalExperience: {
            gte: min,
            lte: max
          }
        });
      } else {
        // Single value (e.g., "3")
        const exp = Number(experience);

        AND.push({
          totalExperience: {
            gte: exp
          }
        });
      }
    }

    //  SKILLS FILTER (Multiple support)
    if (skills && skills !== "All Skills") {
      const skillArray = skills
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      if (skillArray.length > 0) {
        AND.push({
          skills: {
            hasSome: skillArray
          }
        });
      }
    }

    //  LOCATION
    if (location && location !== "City or Country") {
      AND.push({
        OR: [
          { city: { contains: location, mode: "insensitive" } },
          { state: { contains: location, mode: "insensitive" } },
          { country: { contains: location, mode: "insensitive" } }
        ]
      });
    }

    //  DATE FILTER
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

    const where = AND.length ? { AND } : {};

    //  FETCH DATA
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: { candidate: true },
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.application.count({ where })
    ]);

    //  FORMAT RESPONSE
    const formatted = applications.map(app => ({
      applicationId: app.id,

      candidateName: `${app.firstName} ${app.lastName}`,

      contactInfo: {
        email: app.email,
        phone: app.phone
      },

      appliedFor: job.title,

      experience: app.totalExperience
        ? `${app.totalExperience} yrs`
        : "N/A",

      skills: app.skills || [],

      location:
        [app.city, app.state, app.country]
          .filter(Boolean)
          .join(", ") ||
        app.candidate?.location ||
        "N/A",

      resume: app.resumeUrl,

      appliedDate: app.createdAt
    }));

    res.json({
      jobId: job.jobId || `JOB-${job.id}`,
      jobTitle: job.title,

      totalApplicants: total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),

      applicants: formatted
    });

  } catch (error) {
    console.error("GET APPLICANTS ERROR:", error);

    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};