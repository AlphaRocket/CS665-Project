// src/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn, getUserType } from "./utils/auth";

export default function ProtectedRoute({ children, allowedRoles }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userType = getUserType(); // "customer" or "employee"
    if (!allowedRoles.includes(userType)) {
      return <Navigate to="/login" replace />; // or a "403 Forbidden" page
    }
  }

  return children;
}
