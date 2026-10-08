# PKS Course & Enrollment Portal

Ứng dụng tra cứu, quản lý và ghi danh khóa học. Student có thể đăng ký, đăng nhập và xem khóa học đã ghi danh; Admin/Staff quản lý khóa học và danh sách học viên. Hệ thống chặn ghi danh trùng và vượt sĩ số.

**Công nghệ:** React + Vite + TypeScript, Express, Prisma, MySQL, JWT và bcrypt.

ERD: [Sơ đồ database](docs/erd.md).


## 1. Cài đặt

Yêu cầu: Node.js 24.11.1, npm, Git và MySQL 8.4+ hoặc Aiven MySQL. Các lệnh dưới đây dùng PowerShell.

```powershell
git clone https://github.com/ngbio/pks-course-enrollment-portal.git
cd pks-course-enrollment-portal
npm --prefix backend ci
npm --prefix frontend ci
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

## 2. Cấu hình Database

### MySQL local

Mở MySQL Workbench, kết nối bằng tài khoản quản trị và chạy:

```sql
CREATE DATABASE pks_portal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pks'@'localhost' IDENTIFIED BY 'PksLocal123!';
GRANT ALL PRIVILEGES ON pks_portal.* TO 'pks'@'localhost';
```

Sửa các biến trong `backend/.env`:

```dotenv
NODE_ENV=development
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=pks
DB_PASSWORD="PksLocal123!"
DB_NAME=pks_portal
JWT_SECRET=replace-with-at-least-32-random-characters
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4000
TRUST_PROXY_HOPS=0
SEED_DEMO_PASSWORD=PksDemo123!
```

Tạo giá trị cho `JWT_SECRET` bằng lệnh sau rồi dán vào `.env`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### Tạo bảng và dữ liệu mẫu

Từ thư mục gốc project:

```powershell
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration tạo các bảng `users`, `courses`, `enrollments`; seed thêm tài khoản demo và ba khóa học mẫu. Dùng database trống cho lần cài đặt đầu.

## 3. Chạy Backend và Frontend

Terminal thứ nhất, từ thư mục gốc:

```powershell
cd backend
npm run dev
```

Backend: http://localhost:4000/api — Health: http://localhost:4000/api/health

Terminal thứ hai, từ thư mục gốc:

```powershell
cd frontend
npm run dev
```

Frontend: http://localhost:5173

Đổi URL backend trong `frontend/.env` bằng `API_PROXY_TARGET=http://localhost:4000` (không thêm `/api`), rồi khởi động lại Vite. Biến này dùng cho dev/preview; khi deploy Cloudflare, sửa `API_ORIGIN` trong `frontend/wrangler.jsonc`.

## 4. Tài khoản Demo

Sau khi seed database mới với `SEED_DEMO_PASSWORD=PksDemo123!` như hướng dẫn:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@pks.test | sR-CA2MNGY_TfwZXx0DE6u_B |
| Staff | staff@pks.test | sR-CA2MNGY_TfwZXx0DE6u_B |
| Student | student@pks.test | sR-CA2MNGY_TfwZXx0DE6u_B |

Nếu chọn `SEED_DEMO_PASSWORD` khác, dùng mật khẩu đó. Seed không đổi mật khẩu tài khoản đã tồn tại.

## 5. Chạy test

### Backend

Từ thư mục gốc:

```powershell
cd backend
npm test
```

Để chạy integration test, tạo database test riêng trong MySQL Workbench:

```sql
CREATE DATABASE pks_portal_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON pks_portal_test.* TO 'pks'@'localhost';
```

Trong thư mục `backend`, sao chép cấu hình:

```powershell
Copy-Item .env.test.example .env.test
```

Sửa `backend/.env.test` theo database test của bạn; ví dụ cho MySQL local ở trên:

```dotenv
NODE_ENV=test
TEST_DATABASE_URL=mysql://pks:PksLocal123%21@127.0.0.1:3306/pks_portal_test
JWT_SECRET=replace-with-at-least-32-random-characters
SEED_DEMO_PASSWORD=PksDemo123!
```

Điền `JWT_SECRET` đã tạo, sau đó chạy:

```powershell
npm run db:test:migrate
npm run test:integration
```

Integration test xóa dữ liệu trong database `_test`; không dùng database chứa dữ liệu cần giữ.

### Frontend

Sau khi chuẩn bị database test, từ thư mục `backend`:

```powershell
npm run db:test:seed
cd ../frontend
npx playwright install chrome
npm run test:e2e
npm run test:worker
```

Để trống cổng 4010 và 5174; chạy E2E sau khi integration test kết thúc.

### Postman thủ công

Import [collection](docs/postman_collection.json) và [environment mẫu](docs/postman_environment.example.json). Đặt `baseUrl=http://localhost:4000/api`, `origin=http://localhost:4000` và `demoPassword` theo `SEED_DEMO_PASSWORD`, rồi chạy collection theo thứ tự khi backend đang hoạt động.

Ảnh kiểm thử: [docs/postman](docs/postman).


## 6. Link Demo

Chưa triển khai.

