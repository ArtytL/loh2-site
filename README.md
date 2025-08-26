# โล๊ะแผ่นมือ 2 — Deployable App

React + Vite + Tailwind + EmailJS (Hash Router)

## Quick start

```bash
npm i
npm run dev
```

### Fill your info

Open `src/App.jsx` and fill:

- `BANK_INFO` → ชื่อธนาคาร/ชื่อบัญชี/เลขบัญชี/PromptPay
- `EMAILJS_CONFIG` → SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY

> EmailJS → Account → Security → **Allowed Origins**: เพิ่มโดเมน dev (`http://localhost:5173`) และโดเมนจริงของคุณ

## Build

```bash
npm run build
```

- ได้โฟลเดอร์ `dist/` พร้อมอัพ Netlify/Vercel/Pages

## GitHub Pages (optional)

1. แก้ `vite.config.js` → เปิด `base: '/<repo-name>/'`
2. ตั้ง GitHub Pages เป็น `gh-pages` branch
3. `npm run deploy`

