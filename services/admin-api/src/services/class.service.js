import ClassRoom from "../model/classRoom.js";
import Teacher from "../model/teacher.js";
import Student from "../model/student.js";

const addClassService = async (data) => {
  if (!data.name) throw new Error("Field name is required !!");
  const newClass = new ClassRoom(data);

  if (data.ref_teacher) {
    await Teacher.findByIdAndUpdate(ref_teacher, {
      $addToSet: { ref_class: newClass._id },
    });
  }

  if (data.ref_students) {
    await Student.updateMany(
      { _id: { $in: ref_students } },
      { $addToSet: { ref_class: newClass._id } }
    );
  }

  return await newClass.save();
};

const findClassService = async (id) => {
  return await ClassRoom.findById(id);
};

const findAllClassService = async () => {
  return await ClassRoom.find();
};

const updateClassService = async ({ id, data }) => {
  return await ClassRoom.findByIdAndUpdate(id, { $set: data });
};

const deleteClassService = async (id) => {
  return await ClassRoom.findByIdAndDelete(id);
};

const removeFieldsService = async ({ filter, fields }) => {
  
  const unsetObj = fields.reduce((acc, field) => {
    acc[field] = "";
    return acc;
  }, {});

  return await ClassRoom.updateMany(
    filter,
    { $unset: unsetObj }
  );
};

export {
  addClassService,
  findClassService,
  findAllClassService,
  updateClassService,
  deleteClassService,
  removeFieldsService,
};
