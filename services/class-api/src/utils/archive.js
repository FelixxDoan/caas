// storage/archive.js
import fs from "fs";
import path from "path";
import archiver from "archiver";

/** Nén toàn bộ `srcDir` thành file zip ở `zipPath`. */
export async function zipDirectory(srcDir, zipPath) {
  await fs.promises.mkdir(path.dirname(zipPath), { recursive: true });
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    archive.on("warning", (err) => (err.code === "ENOENT" ? null : reject(err)));
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(srcDir, false); // put contents at root of the zip
    archive.finalize();
  });
}
