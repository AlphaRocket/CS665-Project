// src/Inventory.js
import React, { useEffect, useState } from "react";
import axios from "axios";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to view inventory.");
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/inventory", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventory(res.data);
      } catch (err) {
        setError(
          err.response?.data?.error || "Error fetching inventory from server."
        );
      }
    };

    fetchInventory();
  }, []);

  const getRowClass = (inv) => {
    if (inv <= 2) return "low";
    if (inv <= 5) return "medium";
    return "high";
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Inventory</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th>Option ID</th>
            <th>Type</th>
            <th>Name</th>
            <th>Price</th>
            <th>Inventory</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.OptionID} className={getRowClass(item.Inventory)}>
              <td>{item.OptionID}</td>
              <td>{item.OptionType}</td>
              <td>{item.OptionName}</td>
              <td>${item.Price.toFixed(2)}</td>
              <td>{item.Inventory}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .low { background-color: #ffcccc; }
        .medium { background-color: #fff0b3; }
        .high { background-color: #ccffcc; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
      `}</style>
    </div>
  );
}

export default Inventory;
