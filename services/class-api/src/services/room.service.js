import Docker from "dockerode";
import path from "path";
import fs from "fs/promises";
import { collectAndRemoveClassContainers } from "../room/student_collect.js";

import { createNetwork, connectNetworkToTraefik } from "../room/network.js";
import { stopAll, upStack } from "../room/stack.js";
import { createStudentContainer } from "../room/student.js";
import { upsertARecordsHostIP } from "../room/zone.js";
import { changeStatus } from "./class.service.js";

export async function upClass({ classId, students }) {
  const networkName = await createNetwork(classId);

  await connectNetworkToTraefik(networkName);

  const results = await Promise.all(
    students.map((s) => createStudentContainer(classId, networkName, s))
  );

  await upsertARecordsHostIP(
    classId,
    results.map((r) => r.studentId)
  );

  return { message: "Up class success !" };
}

export const upClassBySubject = async ({ classId, students, type }) => {
  const update = await changeStatus({ classId, type });

  const subject = classId.split("-")[1];

  if (subject === "web" && type === "examStatus") {
    const upC = await upClass({ classId, students });
    return { update, upC };
  }
  const stack = await upStack({ subject, type });
  return { stack, update };
};

export async function downClass(classId, opts = {}) {
  const {
    bucket = "students",
    removeWorkspace = false,
    allowPartial = false,
    traefikName = "traefik",
    zonesPath = process.env.ZONES_PATH || "/zones",
    networkPrefix = "classnet-",
  } = opts;

  const docker = new Docker();
  const networkName = `${networkPrefix}${classId}`;
  const errors = [];

  // 1) THU DỮ LIỆU + remove container sinh viên
  let collectedResults = [];
  try {
    collectedResults = await collectAndRemoveClassContainers(classId, {
      bucket,
      removeWorkspace,
    });
    // collectedResults: [{ studentId, uploadedKey }]
  } catch (e) {
    errors.push(`collect failed: ${e?.message || e}`);
  }

  // Phân loại kết quả thu thập
  const collected = [];
  const skipped = [];
  for (const r of collectedResults) {
    if (r?.uploadedKey && r.uploadedKey.length > 0) collected.push(r);
    else skipped.push(r); // không có zip (workspace rỗng/thu lỗi) vẫn đã remove container
  }

  // Nếu không cho phép partial và có sinh viên chưa thu được => dừng, KHÔNG dọn hạ tầng
  if (!allowPartial && skipped.length > 0) {
    return {
      classId,
      collected,
      skipped,
      errors: [
        ...errors,
        `aborted teardown: ${skipped.length} student(s) had no uploaded snapshot`,
      ],
    };
  }

  // 2) Ngắt traefik khỏi network (nếu có)
  try {
    await docker.getNetwork(networkName).disconnect({
      Container: traefikName,
      Force: true,
    });
    console.log(`🔌 Detached ${networkName} <- ${traefikName}`);
  } catch {
    // có thể traefik không nằm trong network — bỏ qua
  }

  // 3) Xóa network lớp
  try {
    await docker.getNetwork(networkName).remove();
    console.log(`🗑️ Đã xoá network ${networkName}`);
  } catch (e) {
    errors.push(`remove network failed: ${e?.message || e}`);
  }

  // 4) Xóa zonefile + reload CoreDNS
  try {
    const file = path.join(zonesPath, `db.${classId}`);
    await fs.rm(file, { force: true });
    console.log(`🗑️ Đã xoá zone db.${classId}`);

    // reload CoreDNS (nếu đang chạy trong Docker)
    try {
      await new Docker().getContainer("coredns").kill({ signal: "SIGHUP" });
      console.log("🔄 CoreDNS reloaded (SIGHUP)");
    } catch {
      // không có coredns container — bỏ qua
    }
  } catch (e) {
    errors.push(`zonefile cleanup failed: ${e?.message || e}`);
  }

  console.log(`✅ Class ${classId} teardown done.`);
  return { classId, collected, skipped, errors };
}

export async function stopAllContainer({ classId, type }) {
  const update = await changeStatus({ classId, type });
  const subject = classId.split("-")[1];

  if (subject === "web" && type === "examStatus") {
    const down = await downClass(classId);
    return { down, update };
  }

  const stack = await stopAll({ subject, type });

  return { update, stack };
}
