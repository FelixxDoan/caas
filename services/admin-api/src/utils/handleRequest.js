const handleRequest = async (res, serviceCall) => {
  try {
    const result = await serviceCall();
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export default handleRequest