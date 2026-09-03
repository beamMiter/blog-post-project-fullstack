/**
 * Test Case List
 *
 * เคสบังคับ (จากห้อง) — จะเขียนเป็น test ในช่วง Unit:
 * - Happy: validBody → next()
 * - Error: ไม่ส่ง title → 400
 * - Error: title "" → 400
 * - Error: category_id "1" → 400
 * - Error: title "   " → 400
 * - Error: status_id 99 → 400
 *
 * เคสที่ออกแบบเอง (อย่างน้อย 2 เคส);
 * reject/error อย่างน้อย 1 ห้ามซ้ำหมวดกับ 6 บังคับ:
 * - Input: validBody แต่ image = "example.com/cover.jpg" (ไม่มี http:// / https://)
 *   | Expected: res.status(400), next() ไม่ถูกเรียก
 *   | เหตุผล: image ผ่าน required + เป็น string แล้ว แต่ผิด "รูปแบบ URL" —
 *     กติกาบังคับให้ขึ้นต้นด้วย http:// หรือ https:// เท่านั้น.
 *     หมวด "format ของค่า" ไม่ซ้ำกับ 6 บังคับ (missing / empty / whitespace / wrong type / enum).
 * - Input: validBody แต่ title = สตริงยาว 201 ตัวอักษร ("a".repeat(201))
 *   | Expected: res.status(400), next() ไม่ถูกเรียก
 *   | เหตุผล: ทดสอบ boundary ความยาวสูงสุดของ title (กติกา: ไม่เกิน 200).
 *     หมวด "ความยาวเกินกำหนด" ไม่ซ้ำกับ 6 บังคับ.
 */

import { describe, test, expect, vi } from "vitest";
import validatePostData from "../middleware/postValidation.mjs";

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

// ข้อมูลที่ถูกต้องครบทุก field — เคส Error ใช้ตัวนี้แล้วพังทีละ field
const validBody = (overrides = {}) => ({
  title: "My First Post",
  image: "https://example.com/cover.jpg",
  category_id: 1,
  description: "สรุปสั้นๆ ของบทความ",
  content: "เนื้อหาบทความแบบเต็ม",
  status_id: 1,
  ...overrides,
});

describe("validatePostData", () => {
  // ─────────────────────────────────────────────
  // เคสบังคับ (6)
  // ─────────────────────────────────────────────

  test("Happy Path: ส่งข้อมูลถูกครบทุก field → next()", () => {
    // Arrange
    const req = { body: validBody() };
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
    const { title, ...bodyWithoutTitle } = validBody();
    const req = { body: bodyWithoutTitle };
    const res = makeRes();
    const next = vi.fn();

    // Act
    validatePostData(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('Error: title "" (สตริงว่าง) → 400', () => {
    // Arrange
    const req = { body: validBody({ title: "" }) };
    const res = makeRes();
    const next = vi.fn();

    // Act
    validatePostData(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('Error: category_id "1" (string แทน number) → 400', () => {
    // Arrange
    const req = { body: validBody({ category_id: "1" }) };
    const res = makeRes();
    const next = vi.fn();

    // Act
    validatePostData(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('Error: title "   " (เว้นวรรคล้วน) → 400', () => {
    // Arrange
    const req = { body: validBody({ title: "   " }) };
    const res = makeRes();
    const next = vi.fn();

    // Act
    validatePostData(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test("Error: status_id 99 (ไม่ใช่ 1 หรือ 2) → 400", () => {
    // Arrange
    const req = { body: validBody({ status_id: 99 }) };
    const res = makeRes();
    const next = vi.fn();

    // Act
    validatePostData(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────
  // เคสออกแบบเอง (2) — ทำในเฟสถัดไป
  // ─────────────────────────────────────────────
  test.todo("Error: image ไม่มี http/https prefix → 400");
  test.todo("Error: title ยาวเกิน 200 ตัวอักษร → 400");
});

export { makeRes, validBody };
