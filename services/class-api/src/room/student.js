// student.js
import path from "path";
import fs from "fs/promises";
import Docker from "dockerode";
import { DOMAIN_SUFFIX, WORKSPACE_ROOT } from "../config.js";

const docker = new Docker({
  socketPath:
    process.platform === "win32"
      ? "//./pipe/docker_engine" // Windows Docker Desktop
      : "/var/run/docker.sock", // Linux/WSL
});

/** Xác định đang chạy Docker Desktop trên Windows */
function isDockerDesktopOnWindows() {
  return process.platform === "win32";
}

/** Native path trên host để tạo thư mục */
function makeHostNativePath(baseRaw, classId, studentId) {
  const cls = String(classId).trim();
  const stu = String(studentId).trim();
  const isWin = /^[A-Za-z]:[\\/]/.test(baseRaw);

  if (isWin) {
    return path.win32.join(baseRaw, cls, stu);
  }
  return path.posix.join(baseRaw, cls, stu);
}

function makeDockerSourcePath(baseRaw, classId, studentId) {
  const cls = String(classId).trim();
  const stu = String(studentId).trim();
  const isWin = /^[A-Za-z]:[\\/]/.test(baseRaw);

  if (isDockerDesktopOnWindows() && isWin) {
    return path.win32.join(baseRaw, cls, stu).trim();
  }
  return path.posix.join(baseRaw, cls, stu).trim();
}

async function ensureDirNative(p) {
  await fs.mkdir(p.trim(), { recursive: true });
}

/** Đảm bảo network tồn tại */
async function ensureNetwork(name) {
  try {
    await docker.createNetwork({ Name: name, Driver: "bridge" });
  } catch (e) {
    if (e?.statusCode !== 409) throw e;
  }
}

/** Lấy IP của container trong network */
async function getIP(containerName, net) {
  const inspect = await docker.getContainer(containerName).inspect();
  return inspect.NetworkSettings.Networks?.[net]?.IPAddress || null;
}

/** Hàm chính tạo container cho student */
export async function createStudentContainer(classId, networkName, studentId) {
  const name = `student-${classId}-${studentId}`;
  const fqdn = `${studentId}.${classId}.${DOMAIN_SUFFIX}`;

  // Nếu container đã tồn tại → trả thông tin
  try {
    await docker.getContainer(name).inspect();
    const ip = await getIP(name, networkName);
    return { name, ip, studentId, fqdn };
  } catch {}

  await ensureNetwork(networkName);

  const baseRaw = (
    WORKSPACE_ROOT || "D:\\WorkSpace\\private_cloud\\Student_workspace"
  ).trim();

  const hostDirNative = makeHostNativePath(baseRaw, classId, studentId);
  await ensureDirNative(hostDirNative);

  // 3) Path để truyền cho Docker daemon
  const hostDirForDocker = makeDockerSourcePath(baseRaw, classId, studentId);

  // 4) Labels Traefik (nếu dùng reverse proxy)
  const routerKey = `${classId}-${studentId}`;
  const labels = {
    "traefik.enable": "true",
    "traefik.docker.network": networkName,

    // Service
    [`traefik.http.services.${routerKey}.loadbalancer.server.port`]: "8080",

    // Router duy nhất (KHÔNG tham chiếu middleware '-pass' nào cả)
    [`traefik.http.routers.${routerKey}.rule`]: `Host(\`${fqdn}\`)`,
    [`traefik.http.routers.${routerKey}.entrypoints`]: "web",

  };

  // 5) Tạo container code-server
  const container = await docker.createContainer({
    Image: "codercom/code-server:latest",
    name,
    WorkingDir: "/workspace",
    Cmd: ["--auth", "none"],
    ExposedPorts: { "8080/tcp": {} },
    HostConfig: {
      NetworkMode: networkName,
      Mounts: [
        {
          Type: "bind",
          Source: hostDirForDocker,
          Target: "/workspace",
        },
      ],
      RestartPolicy: { Name: "unless-stopped" },
    },
    Labels: labels,
  });

  try {
    await container.start();
  } catch (e) {
    try {
      await container.remove({ force: true });
    } catch {}
    throw e;
  }

  const ip = await getIP(name, networkName);
  return {
    name,
    ip,
    studentId,
    fqdn,
    hostPath: hostDirNative,
    containerPath: "/workspace",
  };
}
