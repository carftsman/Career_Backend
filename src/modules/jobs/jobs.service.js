const prisma = require("../../prisma");

exports.getJobs = async (status, search) => {

  const where = {
    ...(status && { status }),

    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },

        //  if skills is ARRAY
        { skills: { hasSome: [search] } },

        //  fallback if skills is string (keep if needed)
        { description: { contains: search, mode: "insensitive" } }
      ]
    })
  };

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true }
      }
    }
  });

  const now = new Date();

  return jobs.map(job => {

    let finalStatus = job.status;

    //  Handle deadline passed
    if (job.deadline && new Date(job.deadline) < now && job.status === "ACTIVE") {
      finalStatus = "DEADLINE_PASSED";
    }

    return {
      id: job.id,

      // Job ID for UI
      jobId: job.jobId ? `#${job.jobId}` : `#JOB-${job.id}`,

      title: job.title,

      department: job.department,

      location: job.location,

      experience: job.experience,

      jobType: job.jobType,

      status: finalStatus,

      applicants: job._count.applications,

      postedDate: job.createdAt
    };
  });
};


exports.getJobById = async (jobId) => {

  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      _count: {
        select: { applications: true }
      }
    }
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