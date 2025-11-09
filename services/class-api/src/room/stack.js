import Docker from "dockerode";
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

/** ================== HẰNG SỐ & DANH SÁCH ================== */
const NETWORK_NAME = "subject_net";

const PG = "postgres_subject";
const SQL_MGR = "sql-manager";
const LEARN_SQL = "learn-sql";
const EXAM_SQL = "exam-sql";
const LEARN_WEB = "learn-web";

const SQL_CORE = [PG, SQL_MGR];
const SQL_ALL = [PG, SQL_MGR, EXAM_SQL, LEARN_SQL];
const WEB_ALL = [LEARN_WEB];

/** ================== TIỆN ÍCH DOCKER ================== */
async function ensureNetwork(name = NETWORK_NAME) {
  try {
    const n = docker.getNetwork(name);
    await n.inspect();
    return name;
  } catch {
    const created = await docker.createNetwork({ Name: name, Driver: "bridge" });
    return created?.id ? name : created;
  }
}

async function inspectOrNull(name) {
  try {
    const c = docker.getContainer(name);
    return await c.inspect();
  } catch {
    return null;
  }
}

async function exists(name) {
  return Boolean(await inspectOrNull(name));
}

async function running(name) {
  const info = await inspectOrNull(name);
  return Boolean(info?.State?.Running);
}

async function stopAndRemove(name) {
  const c = docker.getContainer(name);
  const info = await inspectOrNull(name);
  if (!info) return { name, action: "skip:not-exist" };
  if (info.State?.Running) {
    await c.stop().catch(() => {});
  }
  await c.remove({ force: true }).catch(() => {});
  return { name, action: "removed" };
}

async function stopMany(list) {
  const results = [];
  for (const n of list) {
    try {
      results.push(await stopAndRemove(n));
    } catch (e) {
      results.push({ name: n, action: "error", error: e?.message });
    }
  }
  return results;
}

/** ================== CREATORS ================== */
async function createPostgres(net = NETWORK_NAME) {
  const container = await docker.createContainer({
    Image: "postgres:16",
    name: PG,
    Env: ["POSTGRES_PASSWORD=postgres"],
    HostConfig: {
      NetworkMode: net,
      RestartPolicy: { Name: "unless-stopped" },
      PortBindings: { "5432/tcp": [{ HostPort: "5432" }] },
      Mounts: [
        {
          Type: "bind",
          Source: "D:/WorkSpace/private_cloud/Subject_db/sql",
          Target: "/var/lib/postgresql/data",
        },
        {
          Type: "bind",
          Source: "D:/WorkSpace/micro/micro-repo-dockerized/subject/config/pg_hba.conf",
          Target: "/var/lib/postgresql/data/pg_hba.conf",
        },
      ],
    },
    NetworkingConfig: {
      EndpointsConfig: {
        [net]: { Aliases: ["postgres"] },
      },
    },
  });
  await container.start();
}

async function createSqlManager(net = NETWORK_NAME) {
  const container = await docker.createContainer({
    Image: "sql-manager",
    name: SQL_MGR,
    Env: ["PG_HOST=postgres", "APP_PORT=5000"],
    ExposedPorts: { "5000/tcp": {} },
    HostConfig: {
      NetworkMode: net,
      PortBindings: { "5000/tcp": [{ HostPort: "5000" }] },
    },
  });
  await container.start();
}

async function createExamSql(net = NETWORK_NAME) {
  const container = await docker.createContainer({
    Image: "exam-sql",
    name: EXAM_SQL,
    ExposedPorts: { "80/tcp": {} },
    HostConfig: {
      NetworkMode: net,
      PortBindings: { "80/tcp": [{ HostPort: "8083" }] },
    },
  });
  await container.start();
}

async function createLearnSql(net = NETWORK_NAME) {
  const container = await docker.createContainer({
    Image: "learn-sql",
    name: LEARN_SQL,
    ExposedPorts: { "80/tcp": {} },
    HostConfig: {
      NetworkMode: net,
      PortBindings: { "80/tcp": [{ HostPort: "8081" }] },
    },
  });
  await container.start();
}

async function createLearnWeb(net = NETWORK_NAME) {
  const container = await docker.createContainer({
    Image: "learn-web",
    name: LEARN_WEB,
    ExposedPorts: { "80/tcp": {} },
    HostConfig: {
      NetworkMode: net,
      PortBindings: { "80/tcp": [{ HostPort: "8082" }] },
    },
  });
  await container.start();
}

/** ================== BOOT CORE & STACK ================== */
async function needBootSqlCore() {
  for (const n of SQL_CORE) {
    if (!(await exists(n))) return true;
    if (!(await running(n))) return true;
  }
  return false;
}

export const sqlStack = async (type /* "theoryStatus" | "examStatus" */) => {
  const net = await ensureNetwork(NETWORK_NAME);

  try {
    // Đảm bảo core
    if (await needBootSqlCore()) {
      if (!(await exists(PG))) await createPostgres(net);
      else if (!(await running(PG))) await docker.getContainer(PG).start();

      if (!(await exists(SQL_MGR))) await createSqlManager(net);
      else if (!(await running(SQL_MGR))) await docker.getContainer(SQL_MGR).start();
    }

    // Spin room theo type
    if (type === "theoryStatus") {
      if (!(await exists(LEARN_SQL))) await createLearnSql(net);
      else if (!(await running(LEARN_SQL))) await docker.getContainer(LEARN_SQL).start();
    } else if (type === "examStatus") {
      if (!(await exists(EXAM_SQL))) await createExamSql(net);
      else if (!(await running(EXAM_SQL))) await docker.getContainer(EXAM_SQL).start();
    }
  } catch (err) {
    throw new Error(err?.message || "sqlStack error");
  }

  return { message: "start room success!!", network: net };
};

export const webStack = async () => {
  const net = await ensureNetwork(NETWORK_NAME);
  if (!(await exists(LEARN_WEB))) await createLearnWeb(net);
  else if (!(await running(LEARN_WEB))) await docker.getContainer(LEARN_WEB).start();
  return { message: "Start room success", network: net };
};

export const upStack = async ({ subject, type }) => {
  if (subject === "sql") return await sqlStack(type);
  if (subject === "web") return await webStack();
  return { message: "Error: unknown subject" };
};

/** ================== STOP LOGIC ================== */
/**
 * Luật cho subject="sql":
 * - Nếu CẢ HAI learn-sql & exam-sql đang chạy => chỉ stop/remove đúng container theo `type`, giữ core + container còn lại.
 * - Nếu CHỈ MỘT trong hai đang chạy          => stop/remove TOÀN BỘ SQL stack (core + tất cả room).
 * - Nếu KHÔNG container room nào chạy        => không làm gì thêm (có thể dọn sạch nếu muốn).
 */
async function stopSql({ type /* optional: "theoryStatus" | "examStatus" */ }) {
  const learnRunning = await running(LEARN_SQL);
  const examRunning = await running(EXAM_SQL);

  // Cả hai đang chạy
  if (learnRunning && examRunning) {
    if (type === "theoryStatus") {
      const res = await stopMany([LEARN_SQL]);
      return { mode: "partial", stopped: res, kept: [EXAM_SQL, ...SQL_CORE] };
    }
    if (type === "examStatus") {
      const res = await stopMany([EXAM_SQL]);
      return { mode: "partial", stopped: res, kept: [LEARN_SQL, ...SQL_CORE] };
    }
    // Nếu không truyền type, ta không đoán — trả về gợi ý
    return { message: "Both rooms running. Provide type: 'theoryStatus' or 'examStatus'." };
  }

  // Chỉ một đang chạy -> dỡ toàn bộ SQL stack
  if (learnRunning || examRunning) {
    const res = await stopMany(SQL_ALL);
    return { mode: "full", stopped: res };
  }

  // Không room nào chạy -> không làm gì
  return { mode: "noop", message: "No SQL room running." };
}

async function stopWeb() {
  const res = await stopMany(WEB_ALL);
  return { stopped: res };
}

/**
 * stopAll({ subject, type })
 * - subject === "sql": áp dụng luật ở trên, `type` dùng để chỉ định room cần dừng khi cả hai đang chạy.
 * - subject === "web": dừng tất cả web containers.
 * - subject không truyền: dừng toàn bộ mọi thứ (SQL_ALL + WEB_ALL).
 */
export async function stopAll({subject, type}) {

  if (!subject) {
    const res = await stopMany([...SQL_ALL, ...WEB_ALL]);
    return { mode: "global", stopped: res };
  }
  if (subject === "sql") return await stopSql({ type });
  if (subject === "web") return await stopWeb();
  return { message: "Error: unknown subject" };
}
