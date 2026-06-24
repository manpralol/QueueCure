import { BASE_URL } from '../config/api';

export const patientService = {
  getPatientHistory: async (patientId) => {
    const token = localStorage.getItem('qt-token');
    const res = await fetch(`${BASE_URL}/patients/${patientId}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  }
};

