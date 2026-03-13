const multer = require("multer");

const storage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = uploadMiddleware;