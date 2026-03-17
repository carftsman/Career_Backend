const { Parser } = require("json2csv");
const prisma = require("../../prisma");
const applicantsService = require("./applicants.service");

exports.getApplicants = async (req, res) => {

  try {

    const applicants = await applicantsService.getApplicants();

    res.json({ applicants });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });

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

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23,59,59,999);

    const applications = await prisma.application.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        job: true,
        candidate: true
      }
    });

    const totalApplicants = applications.length;

    const jobStats = {};

    applications.forEach(app => {

      const title = app.job.title;

      if (!jobStats[title]) {
        jobStats[title] = 0;
      }

      jobStats[title]++;

    });

    const skillsCount = {};

    applications.forEach(app => {

      const skills = app.candidate.skills?.split(",") || [];

      skills.forEach(skill => {

        const s = skill.trim();

        if (!skillsCount[s]) {
          skillsCount[s] = 0;
        }

        skillsCount[s]++;

      });

    });

    res.json({
      month: startOfMonth.toLocaleString("default",{month:"long"}),
      totalApplicants,
      applicationsPerJob: jobStats,
      topSkills: skillsCount
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to generate report"
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