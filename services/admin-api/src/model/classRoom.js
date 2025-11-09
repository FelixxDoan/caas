import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },

  code: { type: String, unique: true, required: true },

  ref_subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },

  ref_teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },

  ref_students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }], // Danh sách học sinh

  capacity: { type: Number, default: 30 }, // Sĩ số tối đa

  isActive: { type: Boolean, default: true },

  theoryPort: { type: Number, default: 0 },
  examPort: { type: Number, default: 0 },

  theoryStatus: { type: Boolean, default: false },
  examStatus: { type: Boolean, default: false },
});

const ClassRoom = mongoose.model("ClassRoom", classSchema);

export default ClassRoom;
