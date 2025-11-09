import Student from "./../model/student.js";
import Teacher from "./../model/teacher.js";
import User from "../model/user.js";

const models = {
  student: Student,
  teacher: Teacher,
  user: User
};

const addUserService = async ({ role, data, defaultPassword = "1111" }) => {
  if (!role || !data) throw new Error("Missing role or data");

  const model = models[role];

  if (!model) throw new Error("invalid model");

  const profiles = await model.insertMany(data);

  const users = await Promise.all(
    profiles.map(async (profile) => {
      const userData = {
        email: profile.email,
        password: defaultPassword,
        role: role,
        ref_profile: profile._id,
        profileModel: role.replace(/^./, role[0].toUpperCase()),
      };
      return await User.create([userData]);
    })
  );

  await Promise.all(
    profiles.map((profile, index) => {
      return model.findByIdAndUpdate(profile._id, {
        ref_user: users[index][0]._id,
      });
    })
  );

  return {
    profiles,
    users: users.flat(),
  };
};

const findUserService = async ({ role }) => {
  if (!role) throw new Error("Missing role");

  const model = models[role];
  if (!model) throw new Error("invalid model");

  const profiles = await model.find().select('-password');

  return {
    profiles,
  };
};

const deleteManyService = async ({ role, filter = {} }) => {
  if (!role) throw new Error("Missing role");

  const model = models[role];
  if (!model) throw new Error("invalid model");

  await model.deleteMany(filter);

  return { message: "Delete successfull !!" };
};

const updateUserService = async ({ role, id, fields }) => {
  if (!role || !id || !fields) throw new Error("Missing role, id or fields");

  const model = models[role];
  if (!model) throw new Error("invalid model");

  const updated = await model.findByIdAndUpdate(id, fields, {
    new: true,
  });

  if (!updated) throw new Error("User not found");

  return { message: "Update successful !!", updated };
};

export { addUserService, findUserService, deleteManyService, updateUserService };
