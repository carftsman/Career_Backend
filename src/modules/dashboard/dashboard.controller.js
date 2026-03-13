const prisma = require("../../prisma");

exports.getDashboardOverview = async (req, res) => {
  try {

    const totalJobs = await prisma.job.count();

    const activeJobs = await prisma.job.count({
      where: { status: "ACTIVE" }
    });

    const closedJobs = await prisma.job.count({
      where: { status: "CLOSED" }
    });

    const totalApplicants = await prisma.application.count();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const appliedThisMonth = await prisma.application.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    const registeredCandidates = await prisma.candidate.count();

    const recentJobs = await prisma.job.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        applications: true
      }
    });

    const formattedRecentJobs = recentJobs.map(job => ({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      applicants: job.applications.length,
      postedDate: job.createdAt,
      status: job.status
    }));

    res.json({
      totalJobs,
      activeJobs,
      closedJobs,
      totalApplicants,
      appliedThisMonth,
      registeredCandidates,
      recentJobs: formattedRecentJobs
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });

  }
};