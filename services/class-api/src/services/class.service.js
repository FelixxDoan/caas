// services/class.services.js
import mongoose from "mongoose";
import ClassRoom from "../model/ClassRoom.js";
import Student from "../model/Student.js";
import Teacher from "../model/Teacher.js";

export const findActiveClassByCode = async (code) => {
  const cls = await ClassRoom.findOne({ code }).lean();
  if (!cls) {
    const err = new Error("Class does not exist!");
    err.httpStatus = 404;
    throw err;
  }
  if (!cls.isActive) {
    const err = new Error("Class is inactive!");
    err.httpStatus = 409;
    throw err;
  }
  return cls;
};

export const changeStatus = async ({ classId: code, type }) => {
  if (!["theoryStatus", "examStatus"].includes(type)) {
    throw new Error("Invalid type");
  }

  const r = await ClassRoom.findOneAndUpdate(
    { code },
    [
      {
        $set: {
          [type]: { $not: `$${type}` }, // đảo ngược giá trị hiện tại
        },
      },
    ],
    { new: true, projection: { code: 1, theoryStatus: 1, examStatus: 1 } }
  );

  if (!r) throw new Error("Class not found");

  return r;
};

// Chuẩn hóa so sánh ObjectId và string
const equalId = (a, b) => String(a) === String(b);

export const allClassService = async () => {
  return await ClassRoom.find().lean();
};

export const joinClassByStudent = async ({ ref_profile, code }) => {
  if (!mongoose.Types.ObjectId.isValid(ref_profile)) {
    const err = new Error("Invalid ref_profile!");
    err.httpStatus = 400;
    throw err;
  }
  if (!code) {
    const err = new Error("Class code is required!");
    err.httpStatus = 400;
    throw err;
  }

  const cls = await findActiveClassByCode(code);

  const alreadyInSameSubject = await ClassRoom.findOne({
    _id: { $ne: cls._id },
    isActive: true,
    ref_subject: cls.ref_subject,
    ref_students: new mongoose.Types.ObjectId(ref_profile),
  })
    .select("_id code name")
    .lean();

  if (alreadyInSameSubject) {
    const err = new Error(
      `You already joined another section of this subject (code: ${alreadyInSameSubject.code}).`
    );
    err.httpStatus = 409;
    throw err;
  }

  // Cập nhật lớp theo điều kiện atomic
  const upd = await ClassRoom.updateOne(
    {
      _id: cls._id,
      isActive: true,
      ref_students: { $ne: new mongoose.Types.ObjectId(ref_profile) },
      $expr: { $lt: [{ $size: "$ref_students" }, "$capacity"] },
    },
    { $addToSet: { ref_students: new mongoose.Types.ObjectId(ref_profile) } }
  );

  if (upd.matchedCount === 0) {
    // Không khớp điều kiện => phân tích lại trạng thái mới nhất
    const fresh = await ClassRoom.findById(cls._id).lean();
    if (!fresh?.isActive) {
      const err = new Error("Class is inactive!");
      err.httpStatus = 409;
      throw err;
    }
    if (fresh?.ref_students?.some((id) => equalId(id, ref_profile))) {
      const err = new Error("You already joined this class!");
      err.httpStatus = 409;
      throw err;
    }
    if ((fresh?.ref_students?.length ?? 0) >= fresh.capacity) {
      const err = new Error("This class is full!");
      err.httpStatus = 409;
      throw err;
    }
    const err = new Error("Join class failed by condition!");
    err.httpStatus = 409;
    throw err;
  }

  // Đồng bộ sang Student (không transaction)
  await Student.updateOne(
    { _id: new mongoose.Types.ObjectId(ref_profile) },
    { $addToSet: { ref_class: cls._id } }
  );

  return { message: "Join class success!" };
};

export const leaveClassByStudent = async ({ ref_profile, code }) => {
  if (!mongoose.Types.ObjectId.isValid(ref_profile)) {
    const err = new Error("Invalid ref_profile!");
    err.httpStatus = 400;
    throw err;
  }
  if (!code) {
    const err = new Error("Class code is required!");
    err.httpStatus = 400;
    throw err;
  }

  const cls = await findActiveClassByCode(code);

  // Kiểm tra đang ở trong lớp?
  if (!cls.ref_students?.some((id) => equalId(id, ref_profile))) {
    const err = new Error("You are not in this class!");
    err.httpStatus = 409;
    throw err;
  }

  // Pull khỏi class
  await ClassRoom.updateOne(
    { _id: cls._id },
    { $pull: { ref_students: new mongoose.Types.ObjectId(ref_profile) } }
  );

  // Pull khỏi student
  await Student.updateOne(
    { _id: new mongoose.Types.ObjectId(ref_profile) },
    { $pull: { ref_class: cls._id } }
  );

  return { message: "Leave class success!" };
};

export const joinClassByTeacher = async ({ ref_profile, code }) => {
  if (!mongoose.Types.ObjectId.isValid(ref_profile)) {
    const err = new Error("Invalid ref_profile!");
    err.httpStatus = 400;
    throw err;
  }
  if (!code) {
    const err = new Error("Class code is required!");
    err.httpStatus = 400;
    throw err;
  }

  const cls = await findActiveClassByCode(code);

  // Nếu đã có teacher thì chặn sớm để trả message rõ ràng
  if (cls.ref_teacher) {
    const err = new Error("This class already has a teacher!");
    err.httpStatus = 409;
    throw err;
  }

  // Atomic: chỉ set ref_teacher nếu hiện chưa có
  const upd = await ClassRoom.updateOne(
    {
      _id: cls._id,
      isActive: true,
      $or: [{ ref_teacher: { $exists: false } }, { ref_teacher: null }],
    },
    { $set: { ref_teacher: new mongoose.Types.ObjectId(ref_profile) } }
  );

  if (upd.matchedCount === 0) {
    // Có thể có race condition: giáo viên khác vừa join
    const fresh = await ClassRoom.findById(cls._id).lean();
    if (fresh?.ref_teacher) {
      const err = new Error("This class already has a teacher!");
      err.httpStatus = 409;
      throw err;
    }
    const err = new Error("Join class failed by condition!");
    err.httpStatus = 409;
    throw err;
  }

  await Teacher.updateOne(
    { _id: new mongoose.Types.ObjectId(ref_profile) },
    { $addToSet: { ref_class: cls._id } }
  );

  return { message: "Join class success!" };
};

/* ===================== TEACHER LEAVE ===================== */
/**
 * - Chỉ cho leave nếu đúng giáo viên của lớp
 * - Atomic: unset ref_teacher nếu đang khớp với ref_profile
 */
export const leaveClassByTeacher = async ({ ref_profile, code }) => {
  if (!mongoose.Types.ObjectId.isValid(ref_profile)) {
    const err = new Error("Invalid ref_profile!");
    err.httpStatus = 400;
    throw err;
  }
  if (!code) {
    const err = new Error("Class code is required!");
    err.httpStatus = 400;
    throw err;
  }

  const cls = await findActiveClassByCode(code);

  if (!cls.ref_teacher || !equalId(cls.ref_teacher, ref_profile)) {
    const err = new Error("You are not the teacher of this class!");
    err.httpStatus = 409;
    throw err;
  }

  const upd = await ClassRoom.updateOne(
    { _id: cls._id, ref_teacher: new mongoose.Types.ObjectId(ref_profile) },
    { $unset: { ref_teacher: "" } }
  );

  if (upd.matchedCount === 0) {
    const err = new Error("Leave class failed by condition!");
    err.httpStatus = 409;
    throw err;
  }

  await Teacher.updateOne(
    { _id: new mongoose.Types.ObjectId(ref_profile) },
    { $pull: { ref_class: cls._id } }
  );

  return { message: "Leave class success!" };
};

/* ===================== ROUTER ACTION ===================== */
export const classAction = async ({ role, code, ref_profile, action }) => {
  if (role === "student" && action === "join")
    return joinClassByStudent({ ref_profile, code });

  if (role === "student" && action === "leave")
    return leaveClassByStudent({ ref_profile, code });

  if (role === "teacher" && action === "join")
    return joinClassByTeacher({ ref_profile, code });

  if (role === "teacher" && action === "leave")
    return leaveClassByTeacher({ ref_profile, code });

  const err = new Error("Invalid role or action!");
  err.httpStatus = 400;
  throw err;
};
