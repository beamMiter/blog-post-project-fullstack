# Workshop Notes

## Coverage

### ผลที่รันได้

รันจริง: `npx vitest run --coverage` (v8) ที่โฟลเดอร์ `server/`

> หมายเหตุ: ตาราง summary จะไม่พิมพ์ออกมาถ้ามีเทสต์ fail — ตอนนี้ `tests/demo.test.mjs`
> (scaffold ค้างจากในห้อง) fail อยู่ 1 เคส ตัวเลขด้านล่างมาจากรันที่ตัด `demo.test.mjs` ออก

```
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   20.59 |    20.65 |   10.34 |   21.29 |
 server            |   76.92 |       75 |       0 |   76.92 |
  app.mjs          |   76.92 |       75 |       0 |   76.92 | 16,26-27
 server/apps       |   13.54 |     1.52 |    8.33 |   13.54 |
  auth.mjs         |    9.37 |        0 |       0 |    9.37 | 96-123,128-173
  categoryRouter   |   16.21 |        0 |       0 |   16.21 | 45,51-63,69-80
  postRouter.mjs   |   15.06 |     2.66 |   14.28 |   15.06 | 27-46,72,82-545
  profileRouter    |   11.62 |        0 |       0 |   11.62 | 19-100
 server/middleware |   45.12 |    56.66 |   66.66 |   45.12 |
  postValidation   |   60.41 |    72.05 |     100 |   60.41 | 16,22,27,30,33,36,41,47,52,55,58,61,66,69,72,75,80,83
  protectAdmin.mjs |   28.57 |    14.28 |     100 |   28.57 | 19-52
  protectUser.mjs  |   15.38 |        0 |       0 |   15.38 | 10-32
 server/utils      |   17.26 |    11.92 |    6.89 |   19.46 |
  db.mjs           |   13.66 |    12.62 |    4.76 |   15.83 | 103-109,128-234
  supabase.mjs     |   34.48 |        0 |    12.5 |   34.48 | 25-70
-------------------|---------|----------|---------|---------|-------------------

Statements : 20.59% ( 118/573 )
Branches   : 20.65% ( 69/334 )
Functions  : 10.34% ( 6/58 )
Lines      : 21.29% ( 118/554 )
```

เทสต์ที่มีตอนนี้ (สโคป Create Post):
- `tests/postValidation.test.mjs` — unit 6 เคสบังคับ (+ 2 todo)
- `tests/posts.create.integration.test.mjs` — supertest 3 เคส (Happy + 2 Error)

### จุดที่ยังไม่ครอบ (โฟกัส Create Post)

- **Uncovered 1: `server/middleware/postValidation.mjs` — 60.41% line / 72.05% branch**
  guard ที่ยังไม่โดนยิงเลย (branch = 0):
  - บรรทัด 5 — `req.body` ว่าง / ไม่ใช่ object / เป็น array
  - บรรทัด 15, 21 — `title` ผิด type / ยาวเกิน 200
  - บรรทัด 26, 29, 32, 35 — `image` required / type / ว่าง / **ไม่ขึ้นต้น http(s)://**
  - บรรทัด 40, 46 — `category_id` required / ไม่ใช่จำนวนเต็มบวก
  - บรรทัด 51, 54, 57, 60 — `description` required / type / ว่าง / เกิน 500
  - บรรทัด 65, 68, 71, 74 — `content` required / type / ว่าง / เกิน 5000
  - บรรทัด 79, 82 — `status_id` required / ไม่ใช่ number
  ที่ครอบแล้ว: title required (13), title ว่าง/เว้นวรรค (18), category_id ไม่ใช่ number (43), status_id ไม่ใช่ 1/2 (85), next (89)

- **Uncovered 2: `server/apps/postRouter.mjs` — POST `/` handler 15.06%**
  - บรรทัด 27–46 — สาขา `multipart/form-data` (อัปโหลดไฟล์ + แปลง `category_id` / `status_id` จาก string) ไม่โดนเลย เทสต์ส่งแต่ JSON
  - บรรทัด 72 — `catch` → `res.status(500)` ตอน `connectionPool.query` throw (path ตอน DB ล่ม)

### จะปิดก่อน

**`server/middleware/postValidation.mjs` — guard รูปแบบ URL ของ `image` (บรรทัด 35–36)**
เขียน unit test: `validBody` แต่ `image: "example.com/cover.jpg"` → คาดหวัง `res.status(400)`, `next()` ไม่ถูกเรียก
(ตรงกับ self-designed case 7 ที่วางแผนไว้แล้ว)

### เหตุผล (Impact / Likelihood)

- **Impact: สูง** — ถ้า `image` ที่ไม่ใช่ URL หลุดผ่าน validation จะถูก `INSERT` ลง `posts` ตรง ๆ
  เวลา frontend render `<img src=...>` รูปจะพังทุกจุดที่โชว์โพสต์นั้น (การ์ดหน้า list, หน้า detail)
  และต้องตามไป patch ข้อมูลใน DB ทีหลัง ไม่ใช่แค่ reject request เดียว
- **Likelihood: สูง** — `image` รับ free-form string เป็น field ที่ผู้ใช้ API / Postman พลาดง่ายสุด:
  ลืมใส่ scheme, copy จาก address bar มาได้ `www.` เฉย ๆ, วาง path รูปในเครื่อง, หรือใส่ `ftp://`
  ต่างจาก `category_id` / `status_id` ที่ frontend มักส่งมาถูก type อยู่แล้ว
- **ต้นทุนต่ำ ผลตอบแทนสูง** — unit test 1 เคส ปิด branch ที่ตอนนี้ 0% และเป็นคนละหมวดกับ 6 เคสบังคับ
- **ไม่ได้เลือกเพราะ % ต่ำสุด** — `db.mjs` (13%) เป็น test fake ไม่ใช่ business logic;
  router ส่วนที่ %ต่ำ ส่วนใหญ่เป็น GET/PUT/DELETE นอกสโคป Create Post และหลาย path เป็น
  error branch ที่ likelihood ต่ำ — เลือกจาก Impact × Likelihood ของเส้นทาง Create Post จริง

รองลงมา (รอบถัดไป): `postRouter.mjs` บรรทัด 72 — สาขา 500 ตอน DB ล่ม
Impact สูง (เป็น error contract เดียวของ route นี้) / Likelihood กลาง แต่ต้อง `vi.mock` ให้
`connectionPool.query` reject ก่อน setup มากกว่าเลยไม่เอาก่อน

---

## TestSprite

รันผ่าน TestSprite MCP (backend, scope: codebase) ยิงจริงเข้า `localhost:4001`
ผลเต็มอยู่ที่ `server/testsprite_tests/testsprite-mcp-test-report.md`

AI generate test plan มา **1 เคสเดียว**: `TC001 createpostwithvaliddata` (happy path) → **Passed 1/1 (100%)**
เทสต์ของ AI ทำ end-to-end จริง: `POST /auth/login` → `POST /posts` (body ถูก) → `201`
→ หาโพสต์ผ่าน `GET /posts/admin` → `GET /posts/{id}` เทียบทุก field → `DELETE` cleanup

- **AI พลาดเคส (เทียบกับตารางห้อง 6+2):**
  พลาด **ทั้ง 8 เคส error/validation** — AI generate มาแต่ happy path เคสเดียว
  ไม่มีเลย: ไม่ส่ง title (400) · title `""` (400) · title `"   "` (400) ·
  `category_id "1"` (400) · `status_id 99` (400) · image ไม่มี http(s):// (400) ·
  title > 200 ตัว (400) · ยืนยันว่า insert ไม่ถูกเรียกตอน 400
  → `validatePostData` แทบไม่ถูกแตะโดย TestSprite เลย ต้องพึ่ง unit + integration ที่เขียนเอง

- **AI เพิ่มเคส / ส่วนที่คนต้องอ่านกติกาเอง:**
  - **AI เพิ่มมุมที่เทสต์เราไม่มี:** ตรวจ *round-trip persistence* จริง — สร้างแล้ว
    `GET` กลับมาเทียบทุก field + ทำ flow login → create → read → delete ครบวงจร
    (unit/integration ของเรา mock `res`/DB เช็คแค่ response ไม่ได้ยืนยันว่าข้อมูลถูกเก็บจริง)
  - **AI เดา/พลาดเอง:** hard-code `admin@example.com` / `AdminPass123!` —
    ผ่านเพราะ mock supabase รับ password อะไรก็ได้ ถ้าเป็น auth จริงเทสต์นี้ fail ตั้งแต่ login
  - **ที่คนต้องอ่านกติกาเอง:** ขอบเขต/ค่าจำกัดทั้งหมด (max 200/500/5000, `status_id ∈ {1,2}`,
    integer ≥ 1, ต้องเป็น URL) + กฎ "PUT /posts/:id ไม่มี validatePostData" +
    การเลือกว่า field ไหน impact สูงควรเทสต์ก่อน — AI ไม่ได้หยิบมาทำจาก PRD เอง
