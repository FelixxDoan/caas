import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },                 // Họ tên
  dob: { type: String, required: true },                  // Ngày sinh
  gender: { type: String, enum: ["male", "female", "other"], default: "other" }, // Giới tính
  email: { type: String, unique: true, required: true },  // Email
  phone: { type: String, unique: true, sparse: true },    // Số điện thoại
  address: { type: String },                              // Địa chỉ liên hệ

  subject: [{ type: String }],                            // Các môn dạy
  qualification: { type: String },                        // Trình độ (ThS, TS, ...)

  ref_class: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }], // Các lớp phụ trách
  ref_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },     // Liên kết User

  isActive: { type: Boolean, default: true },             // Trạng thái đang dạy
});

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;
