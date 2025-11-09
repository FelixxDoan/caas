import path from "path";
import Docker from "dockerode";
import { ensureDir, readFile, writeFile, fileExists, nextSerial } from "../utils/fsx.js";
import { ZONES_PATH, HOST_IP } from "../config.js";

const docker = new Docker();

function zoneFilePath(classId) {
  return path.join(ZONES_PATH, `db.${classId}`);
}

function buildSkeleton() {
  return [
    `$TTL 3600`,
    `@   IN SOA ns admin ( 1 7200 3600 1209600 3600 )`,
    `    IN NS  ns`,
    `ns  IN A   127.0.0.1`,
    ``,
  ].join("\n");
}

export async function ensureZoneSkeleton(classId) {
  const file = zoneFilePath(classId);
  await ensureDir(path.dirname(file));
  if (!(await fileExists(file))) {
    await writeFile(file, buildSkeleton());
    console.log(`🧱 Created zone skeleton: ${path.basename(file)}`);
  }
  return file;
}

export async function upsertARecordsHostIP(classId, hosts /* string[] */) {
  const file = await ensureZoneSkeleton(classId);
  let zone = await readFile(file);

  const lines = zone.split("\n");

  // bump SOA serial
  const soaIdx = lines.findIndex((l) => l.includes(" IN SOA "));
  if (soaIdx !== -1) {
    lines[soaIdx] = lines[soaIdx].replace(
      /\(\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\)/,
      (_m, s, r, t, e, n) => `(${nextSerial(s)} ${r} ${t} ${e} ${n})`
    );
  }

  // index current A
  const idxByHost = new Map();
  lines.forEach((line, i) => {
    const m = line.match(/^(\S+)\s+IN\s+A\s+(\S+)/);
    if (m) idxByHost.set(m[1], i);
  });

  for (const host of hosts) {
    const rec = `${host} IN A ${HOST_IP}`;
    if (idxByHost.has(host)) {
      const i = idxByHost.get(host);
      const m = lines[i].match(/^(\S+)\s+IN\s+A\s+(\S+)/);
      if (m && m[2] !== HOST_IP) lines[i] = rec;
    } else {
      lines.push(rec);
    }
  }

  const newZone = lines.join("\n").replace(/\s+$/g, "") + "\n";
  if (newZone !== zone) {
    await writeFile(file, newZone);
    console.log(`🧭 Zone updated: ${path.basename(file)}`);
  } else {
    console.log(`ℹ️ Zone ${path.basename(file)} không thay đổi`);
  }

  // Với CoreDNS `auto` không bắt buộc reload, nhưng để an tâm:
  await reloadCoreDNS();
}

async function reloadCoreDNS() {
  const c = docker.getContainer("coredns");
  try {
    await c.kill({ signal: "SIGHUP" });
    console.log("🔄 CoreDNS signaled (SIGHUP)");
  } catch {
    try { await c.restart(); console.log("🔄 CoreDNS restarted"); } 
    catch (err) { console.error("❌ Không thể reload/restart CoreDNS:", err); }
  }
}
