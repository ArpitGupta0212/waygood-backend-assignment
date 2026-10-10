
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const Student = require("../models/Student");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function generateToken(student) {
  return jwt.sign(
    { sub: student._id.toString() },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new HttpError(400, "Full name, email and password are required.");
  }

  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters long.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingStudent = await Student.findOne({
    email: normalizedEmail,
  });

  if (existingStudent) {
    throw new HttpError(409, "Email is already registered.");
  }

  const student = await Student.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password,
  });

  const token = generateToken(student);

  res.status(201).json({
    success: true,
    message: "Registration successful.",
    data: {
      token,
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        role: student.role,
      },
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(400, "Email and password are required.");
  }

  const student = await Student.findOne({
    email: email.trim().toLowerCase(),
  });

  if (!student || !(await student.comparePassword(password))) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const token = generateToken(student);

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      token,
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        role: student.role,
      },
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      student: req.user,
    },
  });
});

module.exports = {
  register,
  login,
  me,
};
