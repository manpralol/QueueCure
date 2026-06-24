import { BASE_URL } from '../config/api';

export const appointmentService = {
  getAppointments: async (date, doctorId) => {
    const token = localStorage.getItem('qt-token');
    const res = await fetch(`${BASE_URL}/appointments/today?date=${date}&doctorId=${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  rescheduleAppointment: async (id, newTime) => {
    const token = localStorage.getItem('qt-token');
    const res = await fetch(`${BASE_URL}/appointments/${id}/reschedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ newTimeSlot: newTime })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  updateStatus: async (id, status) => {
    const token = localStorage.getItem('qt-token');
    const res = await fetch(`${BASE_URL}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },
  
  getMyAppointments: async () => {
    const token = localStorage.getItem('qt-token');
    const res = await fetch(`${BASE_URL}/patients/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  getDoctors: async () => {
    const token = localStorage.getItem('qt-token');
    const res = await fetch(`${BASE_URL}/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  bookAppointment: async (payload) => {
    const token = localStorage.getItem('qt-token');
    const res = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  }
};

