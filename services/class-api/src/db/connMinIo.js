// db/connMinIo.js
import { Client } from "minio";

const RUN_MODE = (process.env.RUNTIME_MODE || "").toLowerCase(); 
// "container" nếu code chạy trong Docker, ngược lại để trống/host.

const isContainer = RUN_MODE === "container";

// Nếu app chạy TRÊN HOST Windows/macOS/Linux và MinIO chạy trong Docker Desktop:
// → dùng loopback 127.0.0.1:9000 (vì đã publish port ra host).
// Nếu app chạy TRONG CONTAINER cùng mạng với MinIO:
// → dùng service name "minio" (hoặc tên container) và port nội bộ 9000.
const endPoint = isContainer
  ? (process.env.MINIO_HOST || "minio")      // tên service trong docker network
  : (process.env.MINIO_ENDPOINT || "127.0.0.1");

const port = Number(process.env.MINIO_PORT || 9000);
const useSSL = String(process.env.MINIO_USE_SSL || "false").toLowerCase() === "true";

export const minio = new Client({
  endPoint,
  port,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  region: process.env.MINIO_REGION || "",
  pathStyle: true,
});

export async function ensureBucket(name) {
  try {
    // Ping sớm để bắt lỗi kết nối
    await minio.listBuckets();
  } catch (e) {
    console.error("[minio] Không thể kết nối:", {
      endPoint,
      port,
      useSSL,
      runMode: RUN_MODE || "host",
      name: e?.name,
      code: e?.code,
      message: e?.message,
    });
    // Gợi ý nhanh
    console.error(
      isContainer
        ? "Gợi ý: App chạy trong container → dùng endPoint là tên service (ví dụ 'minio'), ensure cùng network; KHÔNG dùng 127.0.0.1."
        : "Gợi ý: App chạy trên host → dùng endPoint=127.0.0.1 và publish port 9000 của MinIO ra host (docker run -p 9000:9000 ...)."
    );
    throw e;
  }

  // Tạo bucket nếu chưa có
  const exists = await minio.bucketExists(name).catch(() => false);
  if (!exists) {
    await minio.makeBucket(name);
  }
}
