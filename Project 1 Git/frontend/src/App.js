// src/App.js
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Orders from "./Orders";
import Inventory from "./Inventory";
import ProtectedRoute from "./ProtectedRoute";
import { isLoggedIn, getUserType } from "./utils/auth"; // create getUserType to decode token

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  const handleLogin = () => setLoggedIn(true);
  const handleLogout = () => setLoggedIn(false);

  const userType = getUserType(); // "customer" or "employee"

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isLoggedIn() ? "/orders" : "/login"} replace />}
        />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        {userType === "employee" && (
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
