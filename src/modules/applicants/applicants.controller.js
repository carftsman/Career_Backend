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




// exports.getApplicantsByJob = async (req, res) => {
//   try {
//     const jobParam = req.params.jobId;

//     let job;

//     //  Support both ID & JOB-XXXX
//     if (!isNaN(jobParam)) {
//       job = await prisma.job.findUnique({
//         where: { id: Number(jobParam) }
//       });
//     }

//     if (!job) {
//       job = await prisma.job.findUnique({
//         where: { jobId: jobParam }
//       });
//     }

//     if (!job) {
//       return res.status(404).json({
//         message: "Job not found"
//       });
//     }

//     const applications = await prisma.application.findMany({
//       where: { jobId: job.id },
//       include: { candidate: true },
//       orderBy: { createdAt: "desc" }
//     });

//     // FORMAT EXACTLY FOR YOUR UI
//     const formatted = applications.map(app => ({
//       applicationId: app.id,

//       //  Candidate Name
//       candidateName: `${app.firstName} ${app.lastName}`,

//       //  Contact Info (combined)
//       contactInfo: {
//         email: app.email,
//         phone: app.phone
//       },

//       //  Job
//       appliedFor: job.title,

//       //  Experience
//       experience: app.totalExperience
//         ? `${app.totalExperience} yrs`
//         : "N/A",

//       //  Skills (array for tags UI)
//       skills: app.skills
//         ? app.skills.split(",").map(s => s.trim())
//         : [],


//       location:
//         [app.city, app.state, app.country]
//           .filter(Boolean)
//           .join(", ") ||
//         app.candidate?.location ||
//         "N/A",

//       //  Resume
//       resumeUrl: app.resumeUrl,

//       //  Date
//       appliedDate: app.createdAt
//     }));

//     res.json({
//       jobId: job.jobId || `JOB-${job.id}`,
//       jobTitle: job.title,
//       totalApplicants: formatted.length,
//       applicants: formatted
//     });

//   } catch (error) {
//     console.error("GET APPLICANTS ERROR:", error);

//     res.status(500).json({
//       message: "Internal server error"
//     });
//   }
// };

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

    //  Find job
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

    //  DATE FILTER
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      dateFilter = {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      };
    }

    //  WHERE CONDITION
    let where = {
      jobId: job.id,
      ...dateFilter
    };

    //  SEARCH
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    //  EXPERIENCE
    if (experience && experience !== "Any Experience") {
      where.totalExperience = {
        gte: Number(experience)
      };
    }

    //  SKILLS
    if (skills && skills !== "All Skills") {
      where.skills = {
        contains: skills,
        mode: "insensitive"
      };
    }

    //  LOCATION
    if (location && location !== "City or Country") {
      where.OR = [
        ...(where.OR || []),
        { city: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } },
        { country: { contains: location, mode: "insensitive" } }
      ];
    }

    //  FETCH DATA
    const applications = await prisma.application.findMany({
      where,
      include: { candidate: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * Number(limit),
      take: Number(limit)
    });

    //  TOTAL COUNT (for pagination)
    const total = await prisma.application.count({ where });

    //  FORMAT (UI MATCH)
    const formatted = applications.map(app => ({
      applicationId: app.id,

      candidateName: `${app.firstName} ${app.lastName}`,

      contactInfo: {
        email: app.email,
        phone: app.phone
      },

      appliedFor: job.title,

      exp: app.totalExperience
        ? `${app.totalExperience} yrs`
        : "N/A",

      skills: app.skills
        ? app.skills.split(",").map(s => s.trim())
        : [],

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
      message: "Internal server error"
    });
  }
};