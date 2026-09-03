/**
 * Integration Test — POST /posts (Create Post)
 *
 * ยิง request จริงผ่าน Express app ด้วย supertest (ไม่ mock route/validation)
 *
 * สภาพแวดล้อมที่พึ่งได้ (เตรียมไว้ในโปรเจกต์แล้ว):
 * - NODE_ENV = "test" (vitest ตั้งให้อัตโนมัติ) → protectAdmin bypass, set req.user เป็น admin
 * - utils/supabase.mjs เป็น mock อยู่แล้ว (ไม่ยิงเน็ต)
 * - utils/db.mjs เป็น MockPool ในหน่วยความจำ → INSERT INTO posts คืน { rowCount: 1 }
 *
 * เคสในคาบ (3):
 * - Happy: body ถูกครบ → 201 + message
 * - Error: ไม่ส่ง title → 400
 * - Error: status_id = 99 → 400
 *
 * ทุกเคส assert 3 ชั้น: Status / Body·Schema / Error(หรือ message ที่ถูกต้อง)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import app from "../app.mjs";

const validPayload = (overrides = {}) => ({
  title: "My First Post",
  image: "https://example.com/cover.jpg",
  category_id: 1,
  description: "สรุปสั้นๆ ของบทความ",
  content: "เนื้อหาบทความแบบเต็ม",
  status_id: 1,
  ...overrides,
});

describe("POST /posts (integration)", () => {
  beforeEach(() => {
    // MockPool เก็บข้อมูลใน memory ของ process — insert แค่ push ต่อ array
    // ไม่มี resource ภายนอกต้องเตรียม เคลียร์ spy กันเคสก่อนหน้าหลุดมา
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("Happy Path: ส่ง body ถูกครบ → 201 Created", async () => {
    // Act
    const res = await request(app).post("/posts").send(validPayload());

    // Assert — ชั้นที่ 1: Status
    expect(res.status).toBe(201);
    // ชั้นที่ 2: Body / Schema
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
    // ชั้นที่ 3: เนื้อหา message ถูกต้องตามที่ route ตอบ
    expect(res.body.message).toBe("Created post successfully");
  });

  test("Error: ไม่ส่ง title → 400", async () => {
    // Arrange
    const { title, ...payloadWithoutTitle } = validPayload();

    // Act
    const res = await request(app).post("/posts").send(payloadWithoutTitle);

    // Assert — Status
    expect(res.status).toBe(400);
    // Body / Schema
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
    // Error: ข้อความต้องสื่อว่าเป็นเรื่อง title และต้องไม่ใช่ 201
    expect(res.body.message).toMatch(/title/i);
    expect(res.status).not.toBe(201);
  });

  test("Error: status_id = 99 (ไม่ใช่ 1 หรือ 2) → 400", async () => {
    // Act
    const res = await request(app)
      .post("/posts")
      .send(validPayload({ status_id: 99 }));

    // Assert — Status
    expect(res.status).toBe(400);
    // Body / Schema
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
    // Error: ข้อความต้องสื่อว่าเป็นเรื่อง status
    expect(res.body.message).toMatch(/status/i);
  });
});
