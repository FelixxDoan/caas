import handleRequest from "../utils/handleRequest.js";

import {
  addSubjectService,
  findSubjectService,
  findAllSubjectService,
  updateSubjectService,
  deleteSubjectService,
} from "../services/subject.service.js";

const addSubject = (req, res) => {
  const { name, image } = req.body;

  handleRequest(
    res,
    async () => await addSubjectService({name, image}).then((data) => ({ data }))
  );
};

const findSubject = (req, res) => {
  const { id } = req.query;
  handleRequest(
    res,
    async () => await findSubjectService(id).then((data) => ({ data }))
  );
};

const findAllSubject = (req, res) => {
  handleRequest(
    res,
    async () => await findAllSubjectService().then((data) => ({ data }))
  );
};

const updateSubject = (req, res) => {
  const { id } = req.query;
  const { name, image } = req.body;

  handleRequest(
    res,
    async () => await updateSubjectService({id, name, image}).then((data) => ({ data }))
  );
};

const deleteSubject = (req, res) => {
  const { id } = req.query;

  handleRequest(
    res,
    async () => await deleteSubjectService(id).then((data) => ({ data }))
  );
};

export { addSubject, findSubject, findAllSubject, updateSubject, deleteSubject };
