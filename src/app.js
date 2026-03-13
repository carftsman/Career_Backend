const express = require("express");
const cors = require("cors");

const { swaggerUi, specs } = require("./swagger/swagger");

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./modules/auth/auth.routes");
const candidateRoutes = require("./modules/candidate/candidate.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");



app.use("/api/auth", authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/dashboard", dashboardRoutes);

/* Swagger Documentation */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/* Health Check Route */
app.get("/", (req, res) => {
  res.send("Career Backend API Running");
});

module.exports = app;