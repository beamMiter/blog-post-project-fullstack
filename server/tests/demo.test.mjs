import { describe, test, vi, expect } from "vitest";
import validatePostData from "../middleware/postValidation.mjs";

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("demo: ทำไมต้อง Mock", () => {
  test("เรียก Validation ตรงๆ โดยไม่เตรียม req/res/next -> ต้อง throw", () => {
    // Arrange & Act & Assert
    expect(() => validatePostData()).toThrow();
    // เพราะฟังก์ชันพยายามเข้าถึง req.body แต่ req เป็น undefined
  });
});

describe("validateCreatePostData", () => {
  test("Happy Path: ส่งข้อมูลถูกครบ ต้องผ่านไป next", () => {
    const req = {
      body: {
        title: "My First Post",
        image: "https://example.com/cover.jpg",
        category_id: 1,
        description: "สรุปสั้นๆ ของบทความ",
        content: "เนื้อหาบทความแบบเต็ม",
        status_id: 1,
      },
    };
    const res = makeRes();
    const next = vi.fn();

    validatePostData(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("Error: ไม่ส่ง title -> 400", () => {
    const req = {
      body: {
        image: "https://example.com/cover.jpg",
        category_id: 1,
        description: "สรุปสั้นๆ ของบทความ",
        content: "เนื้อหาบทความแบบเต็ม",
        status_id: 1,
      },
    };
    const res = makeRes();
    const next = vi.fn();

    validatePostData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});