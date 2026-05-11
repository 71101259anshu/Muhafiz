import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const createTest = async (formData, token) => {
  try {
    // ✅ Ensure it's FormData (important for file uploads)
    if (!(formData instanceof FormData)) {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        fd.append(key, value);
      });
      formData = fd;
    }

    const res = await axios.post(`${API_BASE_URL}/tests`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to create test");
  }
};
