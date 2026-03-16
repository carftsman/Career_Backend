const jobsService = require("./jobs.service");

exports.getJobs = async (req, res) => {

  try {

    const { status } = req.query;

    const jobs = await jobsService.getJobs(status);

    res.json({ jobs });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

  }

};


exports.getJobById = async (req, res) => {

  try {

    const jobId = Number(req.params.jobId);

    const job = await jobsService.getJobById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

  }

};


exports.createJob = async (req, res) => {

  try {

    const {
      title,
      department,
      location,
      experience,
      jobType,
      description,
      responsibilities,
      skills,
      deadline
    } = req.body;

    const createdById = req.user.id;

    const job = await jobsService.createJob({
      title,
      department,
      location,
      experience: Number(experience),
      jobType,
      description,
      responsibilities,
      skills,
      deadline: new Date(deadline),
      createdById
    });

    res.status(201).json({
      message: "Job created successfully",
      job
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

  }

};


exports.closeJob = async (req, res) => {

  try {

    const jobId = Number(req.params.jobId);

    const job = await jobsService.closeJob(jobId);

    res.json({
      message: "Job closed successfully",
      job
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

  }

};


exports.reopenJob = async (req, res) => {

  try {

    const jobId = Number(req.params.jobId);

    const job = await jobsService.reopenJob(jobId);

    res.json({
      message: "Job reopened successfully",
      job
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Internal server error" });

  }

};

exports.updateJob = async (req, res) => {
  try {

    const jobId = Number(req.params.jobId);

    const {
      title,
      department,
      location,
      experience,
      jobType,
      description,
      skills,
      deadline
    } = req.body;

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        title,
        department,
        location,
        experience,
        jobType,
        description,
        skills,
        deadline: new Date(deadline)
      }
    });

    res.json({
      message: "Job updated successfully",
      job
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteJob = async (req, res) => {
  try {

    const jobId = Number(req.params.jobId);

    await prisma.job.delete({
      where: { id: jobId }
    });

    res.json({
      message: "Job deleted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });

  }
};