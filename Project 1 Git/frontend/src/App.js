// src/App.js
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Orders from "./Orders";
import Inventory from "./Inventory";
import ProtectedRoute from "./ProtectedRoute";
import { isLoggedIn, getUserType } from "./utils/auth";

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  const handleLogin = () => setLoggedIn(true);
  const handleLogout = () => setLoggedIn(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={
                isLoggedIn()
                  ? getUserType() === "employee"
                    ? "/inventory"
                    : "/orders"
                  : "/login"
              }
              replace
            />
          }
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
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
