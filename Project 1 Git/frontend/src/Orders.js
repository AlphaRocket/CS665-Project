// src/Orders.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserType } from "./utils/auth";

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  const userType = getUserType(); // "customer" or "employee"

  // Example fetch for orders (optional)
  useEffect(() => {
    // Fetch orders logic here
  }, []);

  return (
    <div>
      <h2>Orders Page</h2>

      {/* Employee-only Inventory Button */}
      {userType === "employee" && (
        <button onClick={() => navigate("/inventory")}>
          Go to Inventory
        </button>
      )}

      {/* Orders list */}
      <ul>
        {orders.map((order) => (
          <li key={order.order_id}>
            Order #{order.order_id} - Total: ${order.total_price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Orders;
