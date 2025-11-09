import Subject from "../model/subject.js";

const addSubjectService = async ({ name, image }) => {
  if (!name || !image) throw new Error("Missign name or image");
  const newSubject = new Subject({
    name,
    image,
  });
  return await newSubject.save();
};

const findSubjectService = async (id) => {
  return await Subject.findById(id);
};

const findAllSubjectService = async () => {
  return await Subject.find();
};

const updateSubjectService = async ({id, data}) => {
  return await Subject.findByIdAndUpdate(id, {$set: data})
};

const deleteSubjectService = async (id) => {
    return await Subject.findByIdAndDelete(id)
}

export { addSubjectService, findSubjectService, findAllSubjectService, updateSubjectService, deleteSubjectService };
