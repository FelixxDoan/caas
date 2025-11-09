import User from "../model/user.js";
import Teacher from "./../model/teacher.js";
import Student from "./../model/student.js";
import { comparePass } from "../utils/hashPassword.js";

export const profileService = async (sub) => {
  const user = await User.findById(sub)
    .select("-password -__v ")
    .populate({
      path: "ref_profile",
      select: "-__v -ref_user -_id",
    })
    .lean(); 

  if (!user) throw new Error("User not found");

  const { ref_profile, _id, profileModel, ...rest } = user;
  const flat = {
    ...rest,
    ...ref_profile, // merge thông tin từ profile lên
  };

  return flat;
};

export const changePass = async ({ sub, currPass, newPass }) => {
  const user = await User.findById(sub);

  const ok = await comparePass(currPass, user.password);
  if (!ok) throw new Error("Wrong pass");

  const isSame = await comparePass(newPass, user.password);
  if (isSame) {
    const err = new Error("New password must be different");
    err.httpStatus = 400;
    throw err;
  }

  user.password = newPass;
  user.passChange = true;

  await user.save();

  return { message: "Change password success !!" };
};
