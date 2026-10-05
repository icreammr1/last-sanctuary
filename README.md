# โบสถ์สุดท้าย — Tower Defense ร่วมมือ 1–4 คน

ป้องกันโบสถ์สุดท้ายแห่งกรุงศรีให้ครบ 20 คลื่น เล่นคนเดียว หรือเล่นออนไลน์กับเพื่อนผ่านเซิร์ฟเวอร์ของคุณเอง

```
shared/core.js     ตรรกะเกมทั้งหมด (ใช้ร่วมกันทั้งเบราว์เซอร์และเซิร์ฟเวอร์)
server/            เซิร์ฟเวอร์ Node.js + ws (รันบน Render)
client/            หน้าเว็บ (deploy บน Netlify) — src/ คือซอร์ส, index.html คือไฟล์ที่ build แล้ว
tools/sim.js       จำลองเกมแบบไม่มีหน้าจอ ไว้ดูบาลานซ์
render.yaml        ตั้งค่า Render (Blueprint)
netlify.toml       ตั้งค่า Netlify
```

## วิธีทำงาน
เซิร์ฟเวอร์เป็นผู้คำนวณเกมจริง ผู้เล่นส่งแค่คำสั่ง (ใช้สกิล, อัพสกิล, ชุบ, เลือกสาย) และรับภาพสถานะกลับมาวาด
ข้อความทุกข้อไม่เกิน 4 KiB ส่ง ~15 ครั้ง/วินาที (ปรับได้ด้วย `SIM_HZ`, `SNAP_HZ`)

## ขั้นตอน deploy

### 1) อัพขึ้น GitHub
```bash
git init
git add .
git commit -m "last sanctuary"
git branch -M main
git remote add origin https://github.com/<ชื่อคุณ>/<ชื่อ repo>.git
git push -u origin main
```

### 2) Render (เซิร์ฟเวอร์)
1. Render → **New +** → **Blueprint** → เลือก repo นี้ (อ่าน `render.yaml` ให้เอง)
   หรือ **New Web Service** แล้วตั้งค่าเอง:
   - Build Command: `npm install --prefix server`
   - Start Command: `node server/server.js`
   - Health Check Path: `/health`
2. รอ deploy เสร็จ จะได้ที่อยู่ เช่น `https://last-sanctuary-server.onrender.com`
3. ทดสอบ: เปิดที่อยู่นั้นในเบราว์เซอร์ ต้องเห็น `{"ok":true,...}`

> แพ็กเกจ Free ของ Render จะหลับเมื่อไม่มีคนใช้ ~15 นาที การเชื่อมต่อครั้งแรกหลังหลับใช้เวลา 30–60 วินาที (หน้าเกมมีข้อความแจ้ง)

### 3) Netlify (หน้าเว็บ)
1. Netlify → **Add new site** → **Import from Git** → เลือก repo เดียวกัน (อ่าน `netlify.toml` ให้เอง)
2. ไปที่ **Site configuration → Environment variables** เพิ่ม
   `LS_SERVER` = `wss://last-sanctuary-server.onrender.com` (ใช้ `wss://` เพราะหน้าเว็บเป็น https)
3. **Trigger deploy** ใหม่ ถ้าต้องการให้ตัวแปรมีผล

ไม่อยากใช้ Git กับ Netlify: แก้ `client/config.js` ให้เป็น `window.LS_SERVER='wss://...';` แล้วลากโฟลเดอร์ `client/` ไปวางที่ Netlify Drop

### 4) (แนะนำ) ล็อกให้เซิร์ฟเวอร์รับเฉพาะเว็บของคุณ
บน Render ตั้ง Environment `ALLOWED_ORIGINS` = `https://<ชื่อ-netlify>.netlify.app` (คั่นหลายค่าด้วย `,`)

## วิธีเล่นออนไลน์
1. เปิดเว็บ → **เล่นกับเพื่อน (ออนไลน์)** → **สร้างห้อง** ได้รหัส 4 ตัวอักษร
2. เพื่อนเปิดเว็บเดียวกัน ใส่รหัส กด **เข้าห้อง** (สูงสุด 4 คน)
3. คนสร้างห้องกด **เริ่มเกม** — เริ่มแล้วคนอื่นเข้าเพิ่มไม่ได้
4. คนหลุดระหว่างเกม บอทจะคุมตัวนั้นแทน

## รันในเครื่อง
```bash
npm run install:server       # ติดตั้ง ws
npm start                    # เซิร์ฟเวอร์ที่ :8080
# ใส่ window.LS_SERVER='ws://localhost:8080' ใน client/config.js แล้วเปิด client/index.html
npm run build                # หลังแก้ shared/core.js หรือ client/src/*
npm run sim -- 4 tank,mage,gunner,support   # จำลองบาลานซ์
```

## การควบคุม
- **1–4** ร่ายสกิล · **W/S** (หรือลูกศร ↑↓ หรือปุ่ม ▲▼ บนจอ) เดินขึ้นลง · **Shift+1–4** อัพสกิล · **F** ชุบเพื่อน
- ปุ่ม **สั่นจอ** มุมขวาบน ปรับระดับการสั่นของหน้าจอได้

## ปรับบาลานซ์
ตัวเลขทั้งหมดอยู่ใน `shared/core.js` ส่วน `CFG`, `CLS`, `EN`, `waveDef`, `SKILLS`
แก้แล้วรัน `npm run build` และ commit ทั้ง `client/index.html` (หรือให้ Netlify build ให้เอง) ส่วนเซิร์ฟเวอร์อ่านไฟล์เดียวกันอัตโนมัติ

## ตัวแปรของเซิร์ฟเวอร์
| ชื่อ | ค่าเริ่มต้น | ความหมาย |
|---|---|---|
| `PORT` | 8080 | (Render ตั้งให้เอง) |
| `SIM_HZ` | 30 | ความถี่คำนวณเกม |
| `SNAP_HZ` | 15 | ความถี่ส่งภาพ |
| `GAME_SPEED` | 2 | ความเร็วเกมออนไลน์ (1 = ปกติ, 2 = เร็วขึ้น 2 เท่า) |
| `MAX_ROOMS` | 100 | จำนวนห้องสูงสุด |
| `ALLOWED_ORIGINS` | ว่าง | โดเมนที่อนุญาต |

## ข้อจำกัดที่รู้
- ยังไม่มีระบบกลับเข้าห้องเมื่อหลุดกลางเกม
- ไม่มีบัญชีผู้ใช้ รหัสห้องคือสิทธิ์เข้าห้อง
- ภาพเป็นกราฟิกที่วาดด้วยโค้ด ยังไม่มีเสียง
