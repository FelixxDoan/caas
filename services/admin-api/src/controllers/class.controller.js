import {
  addClassService,
  findClassService,
  findAllClassService,
  updateClassService,
  deleteClassService,
  removeFieldsService,
} from "../services/class.service.js";
import handleRequest from "../utils/handleRequest.js";

const addClass = (req, res) => {
  const { data } = req.body;

  handleRequest(
    res,
    async () => await addClassService(data).then((data) => ({ data }))
  );
};

const findClass = (req, res) => {
  const { id } = req.query;

  handleRequest(
    res,
    async () => await findClassService(id).then((data) => ({ data }))
  );
};

const allClass = (req, res) => {
  handleRequest(
    res,
    async () => await findAllClassService().then((data) => ({ data }))
  );
};

const updateClass = (req, res) => {
  const { id } = req.query;
  const { data } = req.body;

  handleRequest(
    res,
    async () =>
      await updateClassService({ id, data }).then((data) => ({ data }))
  );
};

const deleteClass = (req, res) => {
  const { id } = req.query;

  handleRequest(
    res,
    async () => await deleteClassService(id).then((data) => ({ data }))
  );
};

const removeFieldsController = (req, res) => {
  const { filter, fields } = req.body;

  handleRequest(
    res,
    async () => await removeFieldsService({ filter, fields })
  )
};

export {
  addClass,
  findClass,
  allClass,
  updateClass,
  deleteClass,
  removeFieldsController,
};
