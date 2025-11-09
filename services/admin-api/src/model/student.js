import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },                // Họ tên
  dob: { type: String, required: true },                 // Ngày sinh
  gender: { type: String, enum: ["male", "female", "other"], default: "other" }, // Giới tính
  address: { type: String },                             // Địa chỉ
  phone: { type: String, unique: true, sparse: true },   // Số điện thoại
  email: { type: String, unique: true, required: true }, // Email

  ref_class: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }], // Lớp học
  ref_score: { type: mongoose.Schema.Types.ObjectId, ref: "Score" },   // Điểm số

  ref_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },     // Tài khoản liên kết
  enrollmentDate: { type: Date, default: Date.now },     // Ngày nhập học

  isActive: { type: Boolean, default: true }, // Trạng thái tài khoản
});

const Student = mongoose.model("Student", studentSchema);

export default Student;
