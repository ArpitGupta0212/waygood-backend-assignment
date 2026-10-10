
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Student = require("../models/Student");
const Program = require("../models/Program");
const University = require("../models/University");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { applicationStatuses } = require("../config/constants");

const listApplications = asyncHandler(async (req, res) => {
const { studentId, status } = req.query;
const filters = {};

if (req.user.role === "student") {
  filters.student = req.user._id;
} else if (studentId) {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new HttpError(400, "Invalid student ID.");
  }

  filters.student = studentId;
}


  if (status) {
    if (!applicationStatuses.includes(status)) {
      throw new HttpError(400, "Invalid application status.");
    }
    filters.status = status;
  }

  const applications = await Application.find(filters)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd")
    .populate("university", "name country city")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: applications });
});


const createApplication = asyncHandler(async (req, res) => {
  const { programId, intake } = req.body;

  // Always use the authenticated student's ID.
  const studentId = req.user._id;

  if (!programId || !intake) {
    throw new HttpError(400, "programId and intake are required.");
  }

  if (!mongoose.isValidObjectId(programId)) {
    throw new HttpError(400, "Invalid program ID.");
  }

  const [student, program] = await Promise.all([
    Student.findById(studentId).lean(),
    Program.findById(programId).lean(),
  ]);

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  if (!program) {
    throw new HttpError(404, "Program not found.");
  }

  if (!program.intakes.includes(intake)) {
    throw new HttpError(400, "Selected intake is not available.");
  }

  const university = await University.findById(program.university).lean();

  if (!university) {
    throw new HttpError(404, "University not found for this program.");
  }

  try {
    const application = await Application.create({
      student: student._id,
      program: program._id,
      university: university._id,
      destinationCountry: program.country,
      intake,
      status: "draft",
      timeline: [
        {
          status: "draft",
          note: "Application created.",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Application created successfully.",
      data: application,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(
        409,
        "An application for this program and intake already exists."
      );
    }
    throw error;
  }
});


const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "Invalid application ID.");
  }

  if (!status || !applicationStatuses.includes(status)) {
    throw new HttpError(400, "Invalid application status.");
  }

  const allowedTransitions = {
    draft: ["submitted"],
    submitted: ["under-review", "rejected"],
    "under-review": ["accepted", "rejected"],
    accepted: [],
    rejected: [],
  };

  const application = await Application.findById(id);

  if (!application) {
    throw new HttpError(404, "Application not found.");
  }

  if (!allowedTransitions[application.status]?.includes(status)) {
    throw new HttpError(
      400,
      `Cannot change status from ${application.status} to ${status}.`
    );
  }

  application.status = status;
  application.timeline.push({
    status,
    note: note || `Status changed to ${status}.`,
    changedAt: new Date(),
  });

  await application.save();

  res.json({
    success: true,
    message: "Application status updated successfully.",
    data: application,
  });
});

module.exports = {
  createApplication,
  listApplications,
  updateApplicationStatus,
};
