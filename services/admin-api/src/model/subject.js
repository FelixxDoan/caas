import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true,},
  image: { type: String, required: true },
});

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
