// student_collect.js
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import Docker from "dockerode";
import { zipDirectory } from "../utils/archive.js";
import { minio, ensureBucket } from "../db/connMinIo.js";
import { WORKSPACE_ROOT } from "../config.js";

const docker = new Docker({
  socketPath:
    process.platform === "win32" ? "//./pipe/docker_engine" : "/var/run/docker.sock",
});

/** YYYY-MM-DD_HH-mm-ss */
function formatTs(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear(),
    m = pad(d.getMonth() + 1),
    day = pad(d.getDate());
  const hh = pad(d.getHours()),
    mm = pad(d.getMinutes()),
    ss = pad(d.getSeconds());
  return `${y}-${m}-${day}_${hh}-${mm}-${ss}`;
}

/**
 * Thu & xoá container của 1 sinh viên:
 * - Nén workspace -> ZIP
 * - Upload ZIP lên MinIO
 * - Dừng & xoá container
 * - (tuỳ chọn) Xoá workspace trên host
 *
 * @param {string} classId
 * @param {string} studentId
 * @param {{bucket?:string, removeWorkspace?:boolean}} opts
 * @returns {{ uploadedKey: string }}
 */
export async function collectAndRemoveStudentContainer(classId, studentId, opts = {}) {
  const { bucket = "students", removeWorkspace = false } = opts;

  const containerName = `student-${classId}-${studentId}`;

  // Thư mục workspace trên host (native path-safe cho Win/Linux)
  const baseRaw =
    (WORKSPACE_ROOT || "D:\\WorkSpace\\private_cloud\\Student_workspace").trim();
  const hostDir = (() => {
    const cls = String(classId).trim();
    const stu = String(studentId).trim();
    const isWin = /^[A-Za-z]:[\\/]/.test(baseRaw);
    return isWin
      ? path.win32.join(baseRaw, cls, stu)
      : path.posix.join(baseRaw, cls, stu);
  })();

  // 1) ZIP workspace (nếu thư mục tồn tại)
  let zipFilePath = null;
  let uploadedKey = "";
  try {
    const stat = await fsp.stat(hostDir).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      // Không có gì để nén; vẫn tiếp tục dừng & xoá container
      zipFilePath = null;
    } else {
      const ts = formatTs();
      const tmpBase =
        process.platform === "win32"
          ? path.join(process.env.TEMP || "C:\\Windows\\Temp", "student-archives")
          : "/tmp/student-archives";

      // đảm bảo thư mục tạm tồn tại
      await fsp.mkdir(tmpBase, { recursive: true }).catch(() => {});

      const fileName = `${classId}__${studentId}__snapshot_${ts}.zip`;
      zipFilePath = path.join(tmpBase, fileName);

      // Nén (zipDirectory phải tạo file zipFilePath)
      await zipDirectory(hostDir, zipFilePath);
    }
  } catch (e) {
    // Nếu nén lỗi, vẫn tiếp tục quy trình dừng container; log để xử lý sau
    console.error(`[archive] Lỗi nén ${hostDir}:`, e?.message);
    zipFilePath = null;
  }

  // 2) Upload ZIP lên MinIO (dùng fPutObject để tránh phải tự tính size/stream)
  try {
    await ensureBucket(bucket);

    if (zipFilePath) {
      const key = `students/${classId}/${studentId}/${path.basename(zipFilePath)}`
        .replace(/\\/g, "/");

      await minio.fPutObject(bucket, key, zipFilePath, {
        "Content-Type": "application/zip",
      });

      uploadedKey = key;
    } else {
      uploadedKey = ""; // không có gì để upload
    }
  } catch (e) {
    console.error("[minio] Upload lỗi:", {
      name: e?.name,
      code: e?.code,
      message: e?.message,
      bucket,
      zipFilePath,
    });
    // vẫn tiếp tục cleanup container, không throw cứng
  } finally {
    // dọn file tạm
    if (zipFilePath) {
      await fsp.unlink(zipFilePath).catch(() => {});
    }
  }

  // 3) Dừng & xoá container
  try {
    const c = docker.getContainer(containerName);
    // dừng nếu đang chạy
    await c.stop({ t: 10 }).catch(() => {});
    await c.remove({ force: true }).catch(() => {});
  } catch (e) {
    // có thể container đã bị xoá từ trước; bỏ qua
  }

  // 4) (Tuỳ chọn) Xoá workspace trên host
  if (removeWorkspace) {
    await fsp.rm(hostDir, { recursive: true, force: true }).catch(() => {});
  }

  return { uploadedKey };
}

/**
 * Thu & xoá **tất cả** container sinh viên của 1 lớp
 * @param {string} classId
 * @param {{bucket?:string, removeWorkspace?:boolean}} opts
 * @returns {Promise<Array<{studentId:string, uploadedKey:string}>>}
 */
export async function collectAndRemoveClassContainers(classId, opts = {}) {
  const list = await docker.listContainers({ all: true });

  // Khớp tên container dạng /student-<classId>-<studentId>
  const hits = list.filter((c) =>
    c.Names?.some((n) => new RegExp(`^/student-${classId}-`).test(n))
  );

  const results = [];
  for (const item of hits) {
    const raw = item.Names[0] || "";
    const name = raw.replace(/^\//, ""); // bỏ leading /
    // studentId là phần sau "student-<classId>-"
    const studentId = name.split("-").slice(2).join("-");
    const r = await collectAndRemoveStudentContainer(classId, studentId, opts);
    results.push({ studentId, ...r });
  }
  return results;
}
