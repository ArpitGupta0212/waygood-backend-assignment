
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Program = require("../models/Program");
const HttpError = require("../utils/httpError");

async function buildProgramRecommendations(studentId) {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new HttpError(400, "Invalid student ID.");
  }

  const student = await Student.findById(studentId).lean();

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  const targetCountries = student.targetCountries || [];
  const interestedFields = student.interestedFields || [];
  const preferredIntake = student.preferredIntake;
  const maxBudgetUsd = student.maxBudgetUsd;
  const ieltsScore = student.englishTest?.score || 0;

  const recommendations = await Program.aggregate([
    {
      $match: {
        ...(targetCountries.length > 0
          ? { country: { $in: targetCountries } }
          : {}),
      },
    },
    {
      $addFields: {
        matchScore: {
          $add: [
            {
              $cond: [
                { $in: ["$country", targetCountries] },
                35,
                0,
              ],
            },
            {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: interestedFields,
                          as: "field",
                          cond: {
                            $regexMatch: {
                              input: "$field",
                              regex: "$$field",
                              options: "i",
                            },
                          },
                        },
                      },
                    },
                    0,
                  ],
                },
                30,
                0,
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $ne: [maxBudgetUsd, null] },
                    { $lte: ["$tuitionFeeUsd", maxBudgetUsd] },
                  ],
                },
                20,
                0,
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $ne: [preferredIntake, null] },
                    { $in: [preferredIntake, "$intakes"] },
                  ],
                },
                10,
                0,
              ],
            },
            {
              $cond: [
                { $gte: [ieltsScore, "$minimumIelts"] },
                5,
                0,
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        reasons: {
          $concatArrays: [
            {
              $cond: [
                { $in: ["$country", targetCountries] },
                [{ $concat: ["Preferred country match: ", "$country"] }],
                [],
              ],
            },
            {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: interestedFields,
                          as: "field",
                          cond: {
                            $regexMatch: {
                              input: "$field",
                              regex: "$$field",
                              options: "i",
                            },
                          },
                        },
                      },
                    },
                    0,
                  ],
                },
                [{ $concat: ["Field alignment: ", "$field"] }],
                [],
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $ne: [maxBudgetUsd, null] },
                    { $lte: ["$tuitionFeeUsd", maxBudgetUsd] },
                  ],
                },
                ["Within budget range"],
                [],
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $ne: [preferredIntake, null] },
                    { $in: [preferredIntake, "$intakes"] },
                  ],
                },
                [
                  {
                    $concat: [
                      "Preferred intake available: ",
                      preferredIntake,
                    ],
                  },
                ],
                [],
              ],
            },
            {
              $cond: [
                { $gte: [ieltsScore, "$minimumIelts"] },
                ["English test score meets requirement"],
                [],
              ],
            },
          ],
        },
      },
    },
    { $sort: { matchScore: -1, tuitionFeeUsd: 1 } },
    { $limit: 5 },
  ]);

  return {
    data: {
      student: {
        id: student._id,
        fullName: student.fullName,
        targetCountries,
        interestedFields,
      },
      recommendations,
    },
    meta: {
      implementationStatus: "mongodb-aggregation",
    },
  };
}

module.exports = {
  buildProgramRecommendations,
};
