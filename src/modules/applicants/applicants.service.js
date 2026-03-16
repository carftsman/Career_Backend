const prisma = require("../../prisma");

exports.getApplicants = async () => {

  const applicants = await prisma.application.findMany({

    include: {
      candidate: true,
      job: true
    },

    orderBy: {
      createdAt: "desc"
    }

  });

  return applicants.map(a => ({
    id: a.id,
    name: a.candidate.firstName + " " + a.candidate.lastName,
    email: a.candidate.email,
    phone: a.candidate.phone,
    jobTitle: a.job.title,
    experience: a.candidate.experience,
    skills: a.candidate.skills,
    location: a.candidate.location,
    resume: a.candidate.resumeUrl,
    appliedDate: a.createdAt
  }));

};