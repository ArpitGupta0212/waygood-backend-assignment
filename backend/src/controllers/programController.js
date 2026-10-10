const Program = require("../models/Program");
const asyncHandler = require("../utils/asyncHandler");

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

const listPrograms = asyncHandler(async (req, res) => {
  const {
    country,
    degreeLevel,
    intake,
    field,
    q,
    maxTuition,
    minimumIelts,
    scholarshipAvailable,
    sortBy = "relevance",
    page = 1,
    limit = 10,
  } = req.query;

  const filters = {};

  if (country) {
    filters.country = country;
  }

  if (degreeLevel) {
    filters.degreeLevel = degreeLevel;
  }

  if (field) {
    filters.field = field;
  }

  if (intake) {
    filters.intakes = intake;
  }

  if (maxTuition !== undefined && maxTuition !== "") {
    const budget = Number(maxTuition);

    if (Number.isFinite(budget) && budget >= 0) {
      filters.tuitionFeeUsd = { $lte: budget };
    }
  }

  if (minimumIelts !== undefined && minimumIelts !== "") {
    const ieltsScore = Number(minimumIelts);

    if (Number.isFinite(ieltsScore) && ieltsScore >= 0) {
      filters.minimumIelts = { $lte: ieltsScore };
    }
  }

  const scholarshipFlag = parseBoolean(scholarshipAvailable);

  if (typeof scholarshipFlag === "boolean") {
    filters.scholarshipAvailable = scholarshipFlag;
  }

  if (q) {
    filters.$or = [
      { title: { $regex: q, $options: "i" } },
      { universityName: { $regex: q, $options: "i" } },
      { field: { $regex: q, $options: "i" } },
    ];
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number(limit) || 10, 1),
    50
  );

  const sortMap = {
    tuitionAsc: { tuitionFeeUsd: 1 },
    tuitionDesc: { tuitionFeeUsd: -1 },
    relevance: {
      scholarshipAvailable: -1,
      tuitionFeeUsd: 1,
    },
  };

  const [items, total] = await Promise.all([
    Program.find(filters)
      .sort(sortMap[sortBy] || sortMap.relevance)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),

    Program.countDocuments(filters),
  ]);

  res.json({
    success: true,
    data: items,
    meta: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

module.exports = {
  listPrograms,
};