import fs from "fs/promises";

export async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

export async function readFile(path, enc = "utf-8") {
  return fs.readFile(path, enc);
}

export async function writeFile(path, content, enc = "utf-8") {
  await fs.writeFile(path, content, enc);
}

export async function fileExists(path) {
  try { await fs.access(path); return true; } catch { return false; }
}

/** Serial kiểu YYYYMMDDNN (UTC) */
export function nextSerial(oldSerial) {
  const now = new Date();
  const base = Number(
    `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
      now.getUTCDate()
    ).padStart(2, "0")}00`
  );
  const prev = Number(oldSerial || 0);
  return String(prev >= base ? prev + 1 : base);
}
