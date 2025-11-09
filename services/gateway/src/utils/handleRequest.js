const handleRequest = async (res, serviceCall) => {
  try {
    const { status = 200, data } = await serviceCall();
    return res.status(status).json(data);
  } catch (error) {
    const status = error.httpStatus || 500;
    const payload = error.payload || { message: error.message || "Server error" };
    console.error("Error:", error);
    return res.status(status).json(payload);
  }
};

export default handleRequest