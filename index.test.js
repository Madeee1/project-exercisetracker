const request = require("supertest");
const app = require("./index.js");

describe("Testing GET at root /", () => {
  it("should return 200 OK", () => {
    return request(app).get("/").expect(200);
  });
});

describe("1. You can POST to /api/users with form data username to create a new user.", () => {
  test("Testing", async () => {
    try {
      const url =
        "https://madeee1-effective-meme-g44xxxv5p7v2w5gp-3000.preview.app.github.dev";
      const res = await fetch(url + "/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=fcc_test_${Date.now()}`.substring(0, 29),
      });

      expect(res.ok).toBe(true);
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
    } catch (error) {
      expect(error).toThrow();
    }
  });
});
