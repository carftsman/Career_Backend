const express = require("express");
const cors = require("cors");

const { swaggerUi, specs } = require("./swagger/swagger");

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./modules/auth/auth.routes");
const candidateRoutes = require("./modules/candidate/candidate.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const jobsRoutes = require("./modules/jobs/jobs.routes");
const candidateJobsRoutes = require("./modules/candidate/candidateJobs.routes");
const applicantsRoutes = require("./modules/applicants/applicants.routes");
const candidateProfileRoutes = require("./modules/candidate/candidateProfile.routes");



app.use("/api/auth", authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/candidate", candidateJobsRoutes);
app.use("/api/applicants", applicantsRoutes);
app.use("/api/candidate", candidateProfileRoutes);

/* Swagger Documentation */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/* Health Check Route */
app.get("/", (req, res) => {
  res.send("Career Backend API Running");
});

module.exports = app;