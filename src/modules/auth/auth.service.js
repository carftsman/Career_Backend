const prisma = require("../../prisma");

const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email }
  });
};

module.exports = {
  findUserByEmail
};