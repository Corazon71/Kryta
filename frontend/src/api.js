import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const api = {
  planDay: async (goal, time) => {
    const res = await axios.post(`${API_URL}/plan`, { goal, available_time: time });
    return res.data;
  },
  
  verifyTask: async (taskId, proof) => {
    const res = await axios.post(`${API_URL}/verify`, { 
      task_id: taskId, 
      proof_content: proof 
    });
    return res.data;
  },

  getDashboard: async () => {
      const res = await axios.get(`${API_URL}/dashboard`);
      return res.data;
  }
};