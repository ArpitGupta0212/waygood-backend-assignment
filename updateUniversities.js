const connectDatabase = require("./backend/src/config/database");
const University = require("./backend/src/models/University");
const seedData = require("./backend/src/data/seedData");

async function updateUniversities() {
  try {
    await connectDatabase();

    for (const university of seedData.universities) {
      const result = await University.updateOne(
        { name: university.name },
        {
          $set: {
            fieldOfStudy: university.fieldOfStudy,
            intakes: university.intakes,
          },
        }
      );

      console.log(
        `${university.name}: matched ${result.matchedCount}, modified ${result.modifiedCount}`
      );
    }
  } catch (error) {
    console.error("Update failed:", error.message);
    process.exitCode = 1;
  } finally {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  }
}

updateUniversities();