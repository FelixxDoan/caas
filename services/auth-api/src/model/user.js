import mongoose from "mongoose";
import {hashPassword} from '../utils/hashPassword.js'

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },   // Email đăng nhập
  password: { type: String },              // Mật khẩu (hash)
  role: { type: String, enum: ["admin", "teacher", "student"], required: true }, // Vai trò

  ref_profile: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "profileModel",
  },
  profileModel: {
    type: String,
    enum: ["Teacher", "Student"],
  },

  passChange: { type: Boolean, default: false },           // Bắt buộc đổi mật khẩu lần đầu
  isActive: { type: Boolean, default: true },              // Trạng thái tài khoản
});

// Middleware hash password trước khi save
userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      this.password = await hashPassword(this.password);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Middleware hash password khi insertMany
userSchema.pre("insertMany", async function (next, docs) {
  try {
    const hashedDocs = await Promise.all(
      docs.map(async (doc) => {
        if (doc.password) {
          doc.password = await hashPassword(doc.password);
        }
        return doc;
      })
    );
    docs.splice(0, docs.length, ...hashedDocs); // gán lại mảng
    next();
  } catch (err) {
    next(err);
  }
});

const   User = mongoose.model("User", userSchema);

export default User;
