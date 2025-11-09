import bcrypt from "bcrypt";
// number of round satl
const satlRounds = 11;

const hashPassword = async (initpass) => {
  try {
    // generate satl to hash
    const satl = await bcrypt.genSalt(satlRounds);

    // hash password
    const hash = await bcrypt.hash(initpass, satl);
    return hash;
  } catch (error) {
    console.log("error in hash: ", error);
    throw error;
  }
};

const comparePass = async (inputPass, hashPassword) => {
    try {
        const result = await bcrypt.compare(inputPass, hashPassword)
        return result
    } catch (error) {
        console.log("error in compare: ", error)
        return false
    }
}

export {
    hashPassword,
    comparePass
}
