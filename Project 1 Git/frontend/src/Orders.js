import React, { useState, useEffect } from "react";
import axios from "axios";
import { getToken, removeToken } from "./utils/auth";
import { useNavigate } from "react-router-dom";

function Orders({ onLogout }) {
  const [drinks, setDrinks] = useState([]);
  const [sodas, setSodas] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [orderDrinks, setOrderDrinks] = useState([]);
  const [message, setMessage] = useState("");
  const token = getToken();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:5000/drinks").then((res) => setDrinks(res.data));
    axios.get("http://localhost:5000/sodas").then((res) => setSodas(res.data));
    axios.get("http://localhost:5000/ingredients").then((res) => setIngredients(res.data));
  }, []);

  const addDrink = () => {
    setOrderDrinks([
      ...orderDrinks,
      { drink_id: "", selected_soda: "", size: "medium", customer_notes: "", ingredients: [] },
    ]);
  };

 const updateDrink = (index, field, value) => {
  const updated = [...orderDrinks];

  // convert numeric fields to numbers
  const parsedValue =
    field === "drink_id" || field === "selected_soda"
      ? Number(value)
      : value;

  updated[index][field] = parsedValue;

  // When selecting a prebuilt drink
  if (field === "drink_id" && parsedValue) {
    const selectedDrink = drinks.find(
      (d) => Number(d.DrinkID) === Number(parsedValue)
    );

    if (selectedDrink) {
      // Auto-fill default soda
      updated[index].selected_soda = Number(selectedDrink.BaseSoda) || "";

      // Auto-fill default ingredients
      updated[index].ingredients = selectedDrink.DefaultIngredients
        ? [...selectedDrink.DefaultIngredients]
        : [];
    }
  }

  setOrderDrinks(updated);
};

  const toggleIngredient = (drinkIndex, ingredientId) => {
    const updated = [...orderDrinks];
    const selected = updated[drinkIndex].ingredients;
    if (selected.includes(ingredientId)) {
      updated[drinkIndex].ingredients = selected.filter((id) => id !== ingredientId);
    } else {
      updated[drinkIndex].ingredients.push(ingredientId);
    }
    setOrderDrinks(updated);
  };

  const createOrder = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/orders",
        { order_drinks: orderDrinks },
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessage("Order Created! ID: " + res.data.order_id);
      setOrderDrinks([]);
    } catch (err) {
      setMessage("Error creating order.");
    }
  };

  const handleLogout = () => {
    removeToken();
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Create Order</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {orderDrinks.map((drink, idx) => {
        const selectedDrink = drinks.find((d) => d.DrinkID === drink.drink_id);
        const defaultSoda = sodas.find((s) => s.SodaID === selectedDrink?.BaseSoda);

        return (
          <div key={idx} style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px" }}>
            <div style={{ marginBottom: "8px" }}>
              <label>Drink:</label><br />
              <select
                value={drink.drink_id}
                onChange={(e) => updateDrink(idx, "drink_id", e.target.value)}
              >
                <option value="">Select Drink</option>
                {drinks.map((d) => (
                  <option key={d.DrinkID} value={d.DrinkID}>{d.DrinkName}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label>Soda:</label><br />
              <select
                value={drink.selected_soda}
                onChange={(e) => updateDrink(idx, "selected_soda", e.target.value)}
              >
                {defaultSoda && (
                  <option value={defaultSoda.SodaID}>
                    Default ({defaultSoda.SodaName})
                  </option>
                )}
                {sodas.map((s) => (
                  <option key={s.SodaID} value={s.SodaID}>
                    {s.SodaName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label>Notes:</label><br />
              <input
                type="text"
                placeholder="Add notes"
                value={drink.customer_notes}
                onChange={(e) => updateDrink(idx, "customer_notes", e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "8px" }}>
              <p>Ingredients:</p>
              {ingredients
                .filter((ing) => ing.Inventory > 0)
                .map((ing) => (
                  <label key={ing.OptionID} style={{ display: "block", marginBottom: "4px" }}>
                    <input
                      type="checkbox"
                      checked={drink.ingredients.includes(ing.OptionID)}
                      onChange={() => toggleIngredient(idx, ing.OptionID)}
                    />
                    {`${ing.OptionName} ($${Number(ing.Price).toFixed(2)})`}
                  </label>
                ))}
            </div>
          </div>
        );
      })}

      <button onClick={addDrink}>Add Drink</button>
      <button onClick={createOrder} style={{ marginLeft: "10px" }}>Place Order</button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Orders;
