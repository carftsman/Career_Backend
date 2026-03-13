const prisma = require("../../prisma");

const findCandidateByEmail = async (email) => {
  return prisma.candidate.findUnique({
    where: { email }
  });
};

const createCandidate = async (data) => {
  return prisma.candidate.create({
    data
  });
};

const updateBasicDetails = async (id, data) => {
  return prisma.candidate.update({
    where: { id },
    data
  });
};

module.exports = {
  findCandidateByEmail,
  createCandidate,
  updateBasicDetails
};