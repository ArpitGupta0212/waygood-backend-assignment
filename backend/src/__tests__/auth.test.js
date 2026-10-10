
const request = require("supertest");
const app = require("../app");

describe("Authentication API", () => {
  test("should reject profile access without a JWT token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("should reject login with invalid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent-user@example.com",
        password: "WrongPassword123!",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
