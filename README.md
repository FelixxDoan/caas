# CAAS — Container-as-a-Service cho giáo dục (README hoàn chỉnh)

> **Mô tả ngắn:** CAAS là hệ thống minh họa một nền tảng học tập thực hành, cho phép tạo và cấp quyền truy cập **container cách ly** theo từng học phần cho sinh viên. Mục tiêu: demo kiến thức backend (auth, RBAC), container orchestration (Docker), storage (MinIO), database (MongoDB), và microservices.

---

## 📌 Mục tiêu README này

* Mô tả rõ bài toán và luồng hoạt động.
* Hướng dẫn dev / chạy local nhanh (docker-compose).
* Liệt kê endpoints quan trọng và ví dụ curl.
* Chỉ dẫn để bạn copy vào CV + câu trả lời phỏng vấn.

---

## 🔎 Bài toán (Problem statement)

Trường đại học hoặc trung tâm đào tạo muốn cung cấp môi trường thực hành (lab) cho từng học phần theo cách:

* Mỗi sinh viên có một môi trường riêng (container) để làm bài mà không ảnh hưởng người khác.
* Giảng viên có thể tạo bài/đề thi, xem bài nộp và chấm điểm.
* Admin quản lý template container, theo dõi hệ thống.

Yêu cầu kỹ thuật: isolation, reproducibility, quản lý tài nguyên, audit/trace và authentication/authorization.

---

## 🧭 Tổng quan kiến trúc

* Microservices: `auth`, `user`, `subject/container` (ví dụ tên: `auth-service`, `user-service`, `container-service`).
* DB: MongoDB (user, metadata, classes, scores).
* Object storage: MinIO (homework uploads, materials).
* Docker Runtime/Nodes: nơi khởi chạy container cho từng student.
* Gateway/API: UI gọi tới Auth → nhận token → gọi User/Subject.

> Xem sơ đồ kiến trúc (file SVG đính kèm trong `/docs/images/architecture.svg`).

---

## 🖼 Architecture diagram

Mình đã tạo sẵn 1 diagram SVG nằm ở `docs/images/architecture.svg`. Nếu bạn clone repo, hãy copy nội dung file SVG (mình đính kèm ở cuối README) vào `docs/images/architecture.svg`.

(Trong file repo: `docs/images/architecture.svg` → dùng trong README UI hoặc GitHub Pages.)

---

## ✅ Tính năng chính (Implemented / Planned)

* Auth: đăng nhập, đăng ký (tuỳ), phát JWT (access + refresh), role-based access (student/teacher/admin).
* User: profile, role, liên kết lớp/học phần.
* Subject/Container Service: quản lý template image, tạo container theo student khi cần, trả endpoint truy cập.
* Storage: upload/download file (MinIO).
* Health endpoints cho mỗi service.
* Dockerized (docker-compose) cho dev local.

---

## ⚙️ Yêu cầu môi trường (Dev)

* Docker & docker-compose
* Node.js (v16+ nếu chạy services standalone)
* pnpm (tuỳ dự án) hoặc npm/yarn

---

## 📁 Cấu trúc thư mục (gợi ý)

```
/services
  /auth-service
  /user-service
  /container-service
/docker-compose.yml
/.env.example
/docs
  /images
    architecture.svg
/README.md
```

---

## 🏁 Quickstart — Chạy local bằng Docker (recommended)

1. Clone repo

```bash
git clone https://github.com/<your-username>/caas.git
cd caas
```

2. Tạo `.env` từ `.env.example` và điền secrets (JWT, DB, MinIO creds).
3. Chạy:

```bash
docker-compose up --build
```

4. Mở:

* Auth service: `http://localhost:4000`
* User service: `http://localhost:3000`
* MinIO web: `http://localhost:9000` (tuỳ cấu hình)

---

## 🔐 `.env.example` (mẫu)

```
# Auth
AUTH_PORT=4000
JWT_ACCESS_SECRET=replace_with_strong_secret
JWT_REFRESH_SECRET=replace_with_other_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# User
USER_PORT=3000
DATABASE_URL=mongodb://mongo:27017/caas

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Docker runtime
RUNTIME_HOST=runtime-node

NODE_ENV=development
```

**LƯU Ý:** Không commit file `.env` vào repo.

---

## 📦 Docker-compose (ví dụ)

Đặt file `docker-compose.yml` với services: mongo, minio, auth, user, container-runtime (simple service). Ví dụ cấu trúc:

```yaml
version: '3.8'
services:
  mongo:
    image: mongo:6
    volumes: ...
  minio:
    image: minio/minio
    command: server /data
  auth-service:
    build: ./services/auth-service
    ports: ['4000:4000']
    env_file: .env
  user-service:
    build: ./services/user-service
    ports: ['3000:3000']
    env_file: .env
  container-runtime:
    build: ./services/container-runtime
    # runtime that talks to docker socket or docker-in-docker
```

````

---

## 🔌 API mẫu (ví dụ endpoints)
### Auth Service (PORT 4000)
- `POST /api/v1/auth/login` — body: `{email, password}` → trả `{ accessToken, refreshToken }`
- `POST /api/v1/auth/refresh` — body: `{ refreshToken }` → new accessToken
- `POST /api/v1/auth/logout` — body: `{ refreshToken }` → revoke

### User Service (PORT 3000)
- `GET /api/v1/users/me` — header `Authorization: Bearer <token>` → profile
- `GET /api/v1/users/:id` — admin/teacher
- `GET /api/v1/subjects` — list subjects available
- `POST /api/v1/subjects/:id/start` — tạo container cho student (protected)

### Container Service
- `POST /api/v1/containers` — body: `{subjectId, userId}` → tạo container, trả `{containerId, url}`
- `GET /api/v1/containers/:id/status`
- `POST /api/v1/containers/:id/stop` — stop container

---

## 🔁 Thực thi flow (ví dụ Student truy cập 1 học phần)
1. Student login → call `POST /auth/login` → nhận access token.
2. UI gọi `GET /user/subjects` với token → hiển thị học phần.
3. Student chọn subject → UI gọi `POST /subjects/:id/start` → backend gọi container-service tạo container.
4. Container-service trả URL (port-forwarding hoặc proxy) → UI redirect student để truy cập môi trường.
5. Student làm bài, upload lên MinIO → Teacher kiểm tra/ chấm điểm.

---

## 🧪 Testing
- Unit tests: Jest (hoặc framework bạn thích) cho từng service.
- Integration tests: Supertest + test database (Mongo memory server) hoặc chạy test stack bằng docker-compose-test.

**Scripts (package.json)**
```json
"scripts": {
  "test": "jest --runInBand",
  "lint": "eslint .",
  "start": "node dist/index.js"
}
````

---

## 🛡 Bảo mật & vận hành (recommendations)

* Lưu secrets trên secret manager (GitHub secrets, Vault) khi CI/CD.
* Validate input (zod/joi/express-validator).
* Hash password bằng bcrypt (salt >= 10).
* Rate-limit auth endpoints.
* Short-lived access token + refresh token store (Redis or DB with revocation list).
* Sử dụng network policies và resource limits cho các container runtime.

---

## 📈 CI / CD (gợi ý GitHub Actions)

* Workflow: lint → test → build docker images → push to registry (optional) → optionally deploy to staging.
* Có thể thêm scheduled job để health-check hệ thống.

---

## 🧾 Cách mô tả dự án trong CV (gợi ý)

```
CAAS — Container-as-a-Service cho giáo dục (Node.js, Docker, MongoDB, MinIO)
• Xây dựng microservices: Auth, User, Container service; thiết kế auth flow (JWT access + refresh) và RBAC.
• Dockerized environment: docker-compose để chạy dev stack; container-per-student model cho isolation và reproducibility.
• Tích hợp object storage (MinIO) cho submissions; đề xuất CI và monitoring để production-ready.
```

---

## ❓ Các câu hỏi phỏng vấn bạn nên chuẩn bị

* Tại sao dùng JWT thay vì sessions?  (scale, statelessness, trade-offs)
* Làm sao để revoke token? (revocation list / store refresh tokens)
* Container-per-student sẽ gây tốn tài nguyên — giải pháp? (limit resources, auto-stop idle, pool templates)
* Bảo mật runtime (ngăn truy cập khỏi host, seccomp, network policies)

---

## 🛣 Roadmap — nâng cấp để ấn tượng hơn

* Auto-scaling runtime nodes, scheduler cho container (kể cả integration k8s)
* Thêm Redis cho session/refresh token store và caching
* Thêm metrics/Prometheus + Grafana
* CI pipeline build multi-arch images, push docker registry
* API docs (OpenAPI/Swagger) và Postman collection

---

## 🖼 Architecture SVG (file: `docs/images/architecture.svg`)

Dưới đây là nội dung SVG của sơ đồ kiến trúc. **Lưu ý:** copy toàn bộ block SVG vào file `docs/images/architecture.svg` trong repo để GitHub hiển thị được hình.

```svg
<!-- Architecture diagram SVG -->
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700" fill="none">
  <defs>
    <style>
      .box { fill:#f7fbff; stroke:#2b6cb0; stroke-width:2; rx:10; }
      .service { fill:#ffffff; stroke:#cbd5e1; stroke-width:1; rx:8; }
      .title { font: 600 16px 'Segoe UI', Roboto, sans-serif; fill:#0b2447; }
      .label { font: 400 13px 'Segoe UI', Roboto, sans-serif; fill:#102a43; }
      .small { font: 400 11px 'Segoe UI', Roboto, sans-serif; fill:#334155; }
      .line { stroke:#94a3b8; stroke-width:2; marker-end:url(#arrow); }
    </style>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="#94a3b8" />
    </marker>
  </defs>

  <!-- Background -->
  <rect x="10" y="10" width="1180" height="680" rx="14" fill="#f8fafc" stroke="#e2e8f0" />

  <!-- Left: Users -->
  <g transform="translate(40,40)">
    <rect class="service" x="0" y="0" width="220" height="140"/>
    <text class="title" x="16" y="26">Users</text>
    <text class="small" x="16" y="50">Student</text>
    <text class="small" x="16" y="72">Teacher</text>
    <text class="small" x="16" y="94">Admin</text>
  </g>

  <!-- Center: UI / Gateway -->
  <g transform="translate(300,40)">
    <rect class="box" x="0" y="0" width="250" height="100"/>
    <text class="title" x="18" y="28">Frontend / API Gateway</text>
    <text class="small" x="18" y="54">Authenticate → Proxy requests</text>
  </g>

  <!-- Right: Services box -->
  <g transform="translate(600,30)">
    <rect x="0" y="0" width="560" height="620" rx="12" fill="#fff" stroke="#cbd5e1" />
    <text class="title" x="18" y="28">Backend Services & Runtime</text>

    <!-- Auth -->
    <rect class="service" x="20" y="50" width="200" height="80"/>
    <text class="label" x="36" y="80">Auth Service</text>
    <text class="small" x="36" y="100">JWT, Roles, Refresh</text>

    <!-- User -->
    <rect class="service" x="260" y="50" width="260" height="80"/>
    <text class="label" x="276" y="80">User Service</text>
    <text class="small" x="276" y="100">Profile, Subjects, RBAC</text>

    <!-- MongoDB -->
    <rect class="service" x="20" y="150" width="240" height="80"/>
    <text class="label" x="36" y="182">MongoDB</text>
    <text class="small" x="36" y="202">User / Meta / Score</text>

    <!-- MinIO -->
    <rect class="service" x="300" y="150" width="220" height="80"/>
    <text class="label" x="316" y="182">MinIO (S3)</text>
    <text class="small" x="316" y="202">Submissions / Materials</text>

    <!-- Container runtime cluster -->
    <rect class="box" x="20" y="260" width="500" height="340" rx="10" />
    <text class="label" x="36" y="288">Container Runtime Cluster</text>

    <!-- Template & containers -->
    <rect class="service" x="40" y="310" width="140" height="200"/>
    <text class="small" x="52" y="360">Image Templates</text>

    <rect class="service" x="210" y="310" width="140" height="200"/>
    <text class="small" x="222" y="360">Student Container A</text>

    <rect class="service" x="360" y="310" width="140" height="200"/>
    <text class="small" x="372" y="360">Student Container B</text>

  </g>

  <!-- Connections: Users -> Gateway -->
  <path class="line" d="M260 100 L300 100" />
  <text class="small" x="200" y="92">Login / Actions</text>

  <!-- Gateway -> Auth -->
  <path class="line" d="M550 90 L620 90" />
  <path class="line" d="M720 90 L860 90" />

  <!-- Auth -> Mongo -->
  <path class="line" d="M720 130 L380 190" />

  <!-- User -> Mongo -->
  <path class="line" d="M870 130 L520 190" />

  <!-- User -> MinIO -->
  <path class="line" d="M870 170 L560 190" />

  <!-- User -> Container cluster -->
  <path class="line" d="M820 200 L620 330" />

  <!-- Auth -> Container (token/ops) -->
  <path class="line" d="M710 110 L600 330" />

  <!-- Legend -->
  <text class="small" x="40" y="660">Generated by Mentor Tech — copy SVG into <code>docs/images/architecture.svg</code></text>
</svg>
```

---

## 🔧 Hỗ trợ tiếp theo

Mình có thể tiếp tục giúp bạn với:

* Tinh chỉnh SVG (thay icon, đổi màu theo brand).
* Viết `.env.example`, `docker-compose.yml` đầy đủ (mình sẽ tạo mẫu cho project của bạn).
* Viết GitHub Actions workflow (CI) mẫu.
* Viết 5 unit tests mẫu cho `auth-service` (Jest + supertest).

---

**Muốn mình xuất file SVG sẵn (upload vào repo) hoặc tạo file `docs/images/architecture.svg` cho bạn luôn không?** Nếu có, mình sẽ tạo file nội dung SVG và đưa link tải trong phản hồi tiếp theo.
