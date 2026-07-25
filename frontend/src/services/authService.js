import api from './api';

export const isTokenValid = token => {
  if (!token) return false;

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return false;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(normalized));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const authenticate = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data.token;
};

export const registerUser = (name, email, password) =>
  api.post('/auth/register', { name, email, password });

