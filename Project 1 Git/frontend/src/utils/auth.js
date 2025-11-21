// src/utils/auth.js

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function removeToken() {
  localStorage.removeItem("token");
}

// NEW: get user type from token payload
export function getUserType() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_type; // must match backend token field
  } catch (err) {
    console.error("Invalid token format", err);
    return null;
  }
}
