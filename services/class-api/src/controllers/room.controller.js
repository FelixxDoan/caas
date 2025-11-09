import {upClassBySubject, stopAllContainer } from "../services/room.service.js";
import handleRequest from "./../utils/handleRequest.js";

const upClassController = (req, res) => {
  const { classId, students, type } = req.body;

  handleRequest(res, async () => await upClassBySubject({ classId, students, type }));
};

const downClassController = (req, res) => {
  const { classId, type } = req.query;

  handleRequest(res, async () => await stopAllContainer({ classId, type }));
};

export { upClassController, downClassController };
