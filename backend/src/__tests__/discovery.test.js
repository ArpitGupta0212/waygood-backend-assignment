
const request = require("supertest");
const app = require("../app");

describe("University and Program Discovery", () => {
  test("should return universities with pagination metadata", async () => {
    const response = await request(app)
      .get("/api/universities?page=1&limit=2");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(2);
    expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
  });

  test("should return programs within the tuition budget", async () => {
    const response = await request(app)
      .get("/api/programs?maxTuition=18000");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    for (const program of response.body.data) {
      expect(program.tuitionFeeUsd).toBeLessThanOrEqual(18000);
    }
  });

  test("should reject recommendations for an invalid student ID", async () => {
    const response = await request(app)
      .get("/api/recommendations/invalid-id");

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
