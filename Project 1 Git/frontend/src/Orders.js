import React, { useState, useEffect } from "react";
import axios from "axios";

function Orders() {
  const [drinks, setDrinks] = useState([]);
  const [sodas, setSodas] = useState([]);
  const [selectedDrinkId, setSelectedDrinkId] = useState("");
  const [selectedSodaId, setSelectedSodaId] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get("http://localhost:5000/drinks").then((res) => setDrinks(res.data));
    axios.get("http://localhost:5000/sodas").then((res) => setSodas(res.data));
  }, []);

  const createOrder = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/orders",
        {
          order_drinks: [
            {
              drink_id: selectedDrinkId,
              size: "medium",
              selected_soda: selectedSodaId,
            },
          ],
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      setMessage("Order Created! ID: " + res.data.order_id);
    } catch (err) {
      setMessage("Error creating order.");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h2>Create Order</h2>

      <select
        value={selectedDrinkId}
        onChange={(e) => setSelectedDrinkId(e.target.value)}
      >
        <option value="">Select Drink</option>
        {drinks.map((d) => (
          <option key={d.DrinkID} value={d.DrinkID}>
            {d.DrinkName}
          </option>
        ))}
      </select>

      <select
        value={selectedSodaId}
        onChange={(e) => setSelectedSodaId(e.target.value)}
      >
        <option value="">Select Soda</option>
        {sodas.map((s) => (
          <option key={s.SodaID} value={s.SodaID}>
            {s.SodaName}
          </option>
        ))}
      </select>

      <button onClick={createOrder}>Place Order</button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Orders;
