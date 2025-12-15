import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const api = {
  planDay: async (goal, time) => {
    const res = await axios.post(`${API_URL}/plan`, { goal, available_time: time });
    return res.data;
  },

  verifyTask: async (taskId, proof, image = null) => {
    const res = await axios.post(`${API_URL}/verify`, {
      task_id: taskId,
      proof_content: proof,
      proof_image: image // Add this
    });
    return res.data;
  },

  getDashboard: async () => {
    const res = await axios.get(`${API_URL}/dashboard`);
    return res.data;
  },

  getAnalytics: async () => {
    const res = await axios.get(`${API_URL}/analytics`);
    return res.data;
  }
};