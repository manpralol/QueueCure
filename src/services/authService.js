import { BASE_URL } from '../config/api';

export const authService = {
  login: async (email, password, role) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      
      if (data.success) {
        return data.data; // { token, role, name }
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  }
};
