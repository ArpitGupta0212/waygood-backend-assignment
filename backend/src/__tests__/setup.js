
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");

beforeAll(async () => {
  await connectDatabase();
}, 15000);

afterAll(async () => {
  await mongoose.disconnect();
});
