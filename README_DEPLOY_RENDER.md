# Deploy MISU Order System lên Render

Mục tiêu production:

```text
Public Website -> Render Node.js -> Apps Script /exec -> Google Sheet
```

## 1. Kiểm tra trước khi deploy

Backend đã sẵn sàng cho Render khi có đủ các điểm này:

- `package.json` có `start`: `node server.js`
- `server.js` dùng `process.env.PORT`
- `.env` local có `GOOGLE_SCRIPT_WEB_APP_URL`
- `GET /health`, `GET /prices`, `POST /orders` chạy OK local
- Apps Script `/exec` trả JSON và Google Sheet `WEB_ORDERS` nhận đơn

## 2. Local flow

Khi chạy local:

```text
Live Server index.html -> http://localhost:3002/orders -> Apps Script /exec -> Google Sheet
```

Frontend tự nhận biết nếu đang mở bằng `localhost`, `127.0.0.1`, hoặc file local thì sẽ gọi:

```text
http://localhost:3002/prices
http://localhost:3002/orders
```

Chạy local:

```bash
npm install
npm run dev
```

Test:

```bash
curl http://localhost:3002/health
curl http://localhost:3002/prices
```

## 3. Production flow

Khi deploy lên Render:

```text
Khách mở https://YOUR_RENDER_URL.onrender.com
-> form gọi https://YOUR_RENDER_URL.onrender.com/orders
-> Render Node.js gọi Apps Script /exec
-> Apps Script ghi Google Sheet
```

Server Render cũng phục vụ trực tiếp `index.html` tại trang chủ `/`, nên khách chỉ cần một link public.

## 4. Push GitHub

Trong VS Code terminal:

```bash
git init
git add .
git commit -m "Deploy MISU Order System to Render"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Nếu repo đã có sẵn remote GitHub thì chỉ cần:

```bash
git add .
git commit -m "Prepare Render deployment"
git push
```

Không push file `.env`; file này đã được đưa vào `.gitignore`.

## 5. Tạo Render Web Service

1. Vào Render Dashboard.
2. Chọn `New` -> `Web Service`.
3. Kết nối GitHub repository.
4. Chọn branch `main`.
5. Cấu hình:

```text
Name: misu-order-system
Runtime: Node
Build Command: npm install
Start Command: npm start
```

Render tự cấp biến `PORT`, không cần tự đặt `PORT=3002` trên Render.

## 6. Environment Variables trên Render

Trong Render Web Service, vào `Environment`, thêm:

```text
NODE_ENV=production
GOOGLE_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
CORS_ORIGIN=*
```

Giữ nguyên Apps Script backend hiện tại nếu `/prices` và `/orders` local đã OK.

## 7. Frontend production URL

Trong `index.html` có dòng:

```js
const RENDER_API_BASE_URL = 'https://YOUR_RENDER_URL.onrender.com';
```

Nếu form được mở ngay từ link Render, app sẽ tự dùng `window.location.origin`, nên không bắt buộc phải sửa dòng này.

Nếu sau này bạn đem `index.html` host ở nơi khác, hãy thay `YOUR_RENDER_URL` bằng domain thật của Render.

## 8. Test sau deploy

Sau khi Render deploy xong, test các URL:

```text
https://YOUR_RENDER_URL.onrender.com/
https://YOUR_RENDER_URL.onrender.com/health
https://YOUR_RENDER_URL.onrender.com/prices
```

Sau đó mở trang chủ, nhập đơn test và bấm gửi.

Trong Render Logs phải thấy:

```text
POST /orders received
payload received:
Apps Script status code:
Apps Script content-type:
Apps Script response preview:
Apps Script result:
```

Trong Google Sheet, tab `WEB_ORDERS` phải có dòng đơn mới.

## 9. Khi cần đổi Apps Script URL

Nếu deploy lại Apps Script và có URL `/exec` mới:

1. Vào Render Web Service.
2. Mở `Environment`.
3. Cập nhật `GOOGLE_SCRIPT_WEB_APP_URL`.
4. Bấm redeploy hoặc restart service.
