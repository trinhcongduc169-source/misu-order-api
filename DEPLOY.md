# MISU Order System Backend

Backend Node.js dung Express de nhan request tu frontend, validate du lieu, sau do goi Google Apps Script Web App de doc bang gia va ghi don vao Google Sheet.

## Cau truc API

- `GET /health`: kiem tra server dang song.
- `GET /prices`: lay bang gia tu Google Sheet thong qua Apps Script.
- `POST /orders`: validate va tao don hang moi.

## Chay local

1. Cai dependencies:

```bash
npm install
```

2. Tao file `.env` tu `.env.example`:

```bash
GOOGLE_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
PORT=3000
```

3. Chay server local:

```bash
npm run dev
```

4. Kiem tra server:

```bash
curl http://localhost:3000/health
```

## Deploy Render

1. Day source code len GitHub.
2. Vao Render va chon `New > Web Service`.
3. Ket noi repository cua MISU Order System.
4. Cau hinh:
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Trong `Environment`, them:

```bash
GOOGLE_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
PORT=3000
```

Render se tu gan port qua bien `PORT`; neu Render cap gia tri khac `3000`, server van tu doc dung.

## Google Apps Script

Apps Script Web App can ho tro:

- Payload lay gia:

```json
{
  "action": "getPriceTable"
}
```

- Payload tao don:

```json
{
  "action": "submitOrder",
  "orderData": {
    "orderCode": "MISU-20260511183000-123",
    "customerName": "Nguyen Van A",
    "phone": "0900000000",
    "address": "TP.HCM",
    "items": []
  }
}
```
