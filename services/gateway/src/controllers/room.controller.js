import { downClassService, upClassService } from "../services/room.service.js";
import handleRequest from "./../utils/handleRequest.js";

const upClass = (req, res) => {
  const { role } = req.user;
  const { code: classId, ref_students: students, type } = req.body;

  if (!role || role != "teacher")
    return res.status(401).json({ message: "Not a Teacher" });

  handleRequest(
    res,
    async () => await upClassService({ classId, students, type })
  );
};

const downClass = (req, res) => {
  const { role } = req.user;
  const { code: classId, type } = req.body;

  if (!role || role != "teacher")
    return res.status(401).json({ message: "Not a Teacher" });

  handleRequest(res, async () => await downClassService({ classId, type }));
};

const enterClass = (req, res) => {
  const { role, sub } = req.user;

  if (role != "student")
    return res.status(403).json({ message: "only student" });

  
  return res.status(200).json({ ok: true, sub });
};

export { upClass, downClass, enterClass };
