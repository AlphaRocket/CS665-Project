// src/utils/auth.js
import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "token";

// Store token
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Retrieve token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Remove token (logout)
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Check if user is logged in
export const isLoggedIn = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const exp = decoded.exp;
    if (!exp) return false;
    return Date.now() < exp * 1000;
  } catch (err) {
    return false;
  }
};

// Get user type: "customer" or "employee"
export const getUserType = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.user_type || null;
  } catch (err) {
    return null;
  }
};

