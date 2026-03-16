const prisma = require("../../prisma");

exports.getJobs = async (status) => {

  const where = status ? { status } : {};

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true }
      }
    }
  });

  return jobs.map(job => ({
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    experience: job.experience,
    jobType: job.jobType,
    status: job.status,
    applicants: job._count.applications,
    postedDate: job.createdAt
  }));

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