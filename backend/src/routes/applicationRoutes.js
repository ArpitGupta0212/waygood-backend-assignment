
const express = require("express");

const {
  createApplication,
  listApplications,
  updateApplicationStatus,
} = require("../controllers/applicationController");

const { requireAuth } = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");

const router = express.Router();

// Students can view their own applications; counselors can view applications.
router.get("/", requireAuth, listApplications);

// Only students can submit applications.
router.post(
  "/",
  requireAuth,
  authorizeRole("student"),
  createApplication
);

// Only counselors can update application status.
router.patch(
  "/:id/status",
  requireAuth,
  authorizeRole("counselor"),
  updateApplicationStatus
);

module.exports = router;
