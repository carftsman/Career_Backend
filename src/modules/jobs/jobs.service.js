const prisma = require("../../prisma");

exports.getJobs = async (status, search) => {

  const now = new Date();

  //  STEP 1: AUTO CLOSE EXPIRED JOBS
  await prisma.job.updateMany({
    where: {
      deadline: { lt: now },
      status: "ACTIVE"
    },
    data: {
      status: "CLOSED"
    }
  });

  const where = {
    ...(status && { status }),

    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { skills: { hasSome: [search] } },
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

  return jobs.map(job => {

    const isExpired = job.deadline && new Date(job.deadline) < now;

    return {
      id: job.id,

      jobId: job.jobId ? `#${job.jobId}` : `#JOB-${job.id}`,

      title: job.title,
      department: job.department,
      location: job.location,
      experience: job.experience,
      jobType: job.jobType,

      //  System status (for tabs)
      status: job.status,

      //  UI status (for badge)
      displayStatus: isExpired ? "DEADLINE_PASSED" : job.status,

      applicants: job._count.applications,
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