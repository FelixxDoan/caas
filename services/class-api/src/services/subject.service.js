import Subject from "../model/subject.js";
import ClassRoom from "../model/ClassRoom.js";

const findSubjectService = async (id) => {
  const _class = await ClassRoom.findById(id);
  const {
    ref_students,
    code,
    status,
    examPort,
    theoryPort,
    capacity,
    examStatus,
    theoryStatus,
  } = _class;
  const subject = await Subject.findById(_class.ref_subject).lean();
  return {
    ...subject,
    ref_students,
    code,
    status,
    examPort,
    theoryPort,
    capacity,
    examStatus,
    theoryStatus,
  };
};

export { findSubjectService };
