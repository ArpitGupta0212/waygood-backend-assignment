
const request = require("supertest");
const app = require("../app");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

describe("Application Workflow", () => {
  let counselorToken;

  beforeAll(() => {
    counselorToken = jwt.sign(
      { sub: "6aca12fc2ebd6b1404404703" },
      env.jwtSecret,
      { expiresIn: "15m" }
    );
  });

  test("should reject an invalid application ID", async () => {
    const response = await request(app)
      .patch("/api/applications/invalid-id/status")
      .set("Authorization", `Bearer ${counselorToken}`)
      .send({
        status: "under-review",
        note: "Testing invalid ID",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
  
test("should prevent a student from updating application status", async () => {
  const studentToken = jwt.sign(
    { sub: "6aca12fc2ebd6b1404404701" },
    env.jwtSecret,
    { expiresIn: "15m" }
  );

  const response = await request(app)
    .patch("/api/applications/6aca12fc2ebd6b1404404707/status")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({
      status: "rejected",
      note: "Testing student permissions"
    });

  expect(response.statusCode).toBe(403);
  expect(response.body.success).toBe(false);
});
    
test("should reject application creation without a program ID", async () => {
  const studentToken = jwt.sign(
    { sub: "6aca12fc2ebd6b1404404701" },
    env.jwtSecret,
    { expiresIn: "15m" }
  );

  const response = await request(app)
    .post("/api/applications")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({
      studentId: "6aca12fc2ebd6b1404404703",
      intake: "September",
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.success).toBe(false);
});

test("should reject a duplicate application", async () => {
  const studentToken = jwt.sign(
    { sub: "6aca12fc2ebd6b1404404701" },
    env.jwtSecret,
    { expiresIn: "15m" }
  );

  const response = await request(app)
    .post("/api/applications")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({
      programId: "6aca12fc2ebd6b14044046f8",
      intake: "September",
    });

  expect(response.statusCode).toBe(409);
  expect(response.body.success).toBe(false);
});

test("should reject an invalid status transition", async () => {
  const response = await request(app)
    .patch("/api/applications/6aca12fc2ebd6b1404404707/status")
    .set("Authorization", `Bearer ${counselorToken}`)
    .send({
      status: "draft",
      note: "Testing invalid transition",
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.success).toBe(false);
});

test("should require authentication to list applications", async () => {
  const response = await request(app).get("/api/applications");

  expect(response.statusCode).toBe(401);
  expect(response.body.success).toBe(false);
});


test("should not allow a student to list another student's applications", async () => {
  const studentToken = jwt.sign(
    { sub: "6aca12fc2ebd6b1404404701" },
    env.jwtSecret,
    { expiresIn: "15m" }
  );

  const response = await request(app)
    .get("/api/applications?studentId=6aca12fc2ebd6b1404404702")
    .set("Authorization", `Bearer ${studentToken}`);

  expect(response.statusCode).toBe(200);
  expect(response.body.success).toBe(true);

  for (const application of response.body.data) {
    expect(application.student._id).toBe("6aca12fc2ebd6b1404404701");
  }
});


  test("should reject an invalid application status", async () => {
    const response = await request(app)
      .patch("/api/applications/6aca12fc2ebd6b1404404707/status")
      .set("Authorization", `Bearer ${counselorToken}`)
      .send({
        status: "invalid-status",
        note: "Testing invalid status",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
