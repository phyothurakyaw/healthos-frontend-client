import { api } from './api';
// Server creates/verifies JWT and stores it in an HttpOnly cookie.
export const auth = {
  me: () => api('/auth/me'),
  login: (email, password) => api('/auth/login', {method:'POST',body:JSON.stringify({email,password})}),
  register: (name,email,password) => api('/auth/register', {method:'POST',body:JSON.stringify({name,email,password})}),
  logout: () => api('/auth/logout', {method:'POST'}),
};
