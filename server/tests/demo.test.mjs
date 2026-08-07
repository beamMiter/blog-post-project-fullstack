//  * Test Case List
//  *
//  * เคสบังคับ (จากห้อง) — จะเขียนเป็น test ในช่วง Unit:
//  * - Happy: validBody → next() ✓
//  * - Error: ไม่ส่ง title → 400 ✓

// ทำการเขียน test case สำหรับ case เหล่านี้ (เขียนแค่ 2 test case): 
//  * - Error: title "" → 400
//  * - Error: category_id "1" → 400
//  * - Error: title " " → 400
//  * - Error: status_id 99 → 400



import { describe, test, vi, expect } from "vitest";
import validatePostData from "../middleware/postValidation.mjs";

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("validateCreatePostData", () => {
  test("Happy Path: ส่งข้อมูลถูกครบ ต้องผ่านไป next", () => {
    // Arrange
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

    // Act
    validatePostData(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("Error: ไม่ส่ง title → 400", () => {
    // Arrange
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

    // Act
    validatePostData(req, res, next);

    // Assert
    // เคส Error คือ res.status ต้องถูกเรียกด้วย 400 และ next ต้องไม่ถูกเรียก
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

