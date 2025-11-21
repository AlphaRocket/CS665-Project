import React, { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "./utils/auth";

function PrebuiltDrinkBuilder({ onClose }) {
  const [drinkName, setDrinkName] = useState("");
  const [baseSoda, setBaseSoda] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [message, setMessage] = useState("");

  const token = getToken();

  useEffect(() => {
    axios.get("http://localhost:5000/ingredients").then(res => setIngredients(res.data));
  }, []);

  const toggleIngredient = (id) => {
    setSelectedIngredients(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!drinkName || !baseSoda) {
      setMessage("Drink name and base soda are required.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/prebuilt-drinks",
        {
          drink_name: drinkName,
          base_soda: baseSoda,
          base_price: parseFloat(basePrice) || 0,
          ingredients: selectedIngredients
        },
        { headers: { Authorization: "Bearer " + token } }
      );

      setMessage("Prebuilt drink added! ID: " + res.data.DrinkID);
      setDrinkName("");
      setBaseSoda("");
      setBasePrice("");
      setSelectedIngredients([]);
    } catch (err) {
      setMessage("Error adding drink.");
    }
  };

  return (
    <div style={{ border: "1px solid #333", padding: "15px", margin: "15px 0" }}>
      <h3>Add Prebuilt Drink</h3>

      <input
        type="text"
        placeholder="Drink Name"
        value={drinkName}
        onChange={e => setDrinkName(e.target.value)}
      />
      <br />

      <input
        type="number"
        placeholder="Base Price"
        value={basePrice}
        onChange={e => setBasePrice(e.target.value)}
      />
      <br />

      <label>Base Soda:</label>
      <select value={baseSoda} onChange={e => setBaseSoda(e.target.value)}>
        <option value="">Select Soda</option>
        {ingredients.filter(i => i.OptionType === "soda").map(s => (
          <option key={s.OptionID} value={s.OptionID}>{s.OptionName}</option>
        ))}
      </select>
      <br />

      <p>Ingredients:</p>
      {ingredients.map(ing => (
        <label key={ing.OptionID} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={selectedIngredients.includes(ing.OptionID)}
            onChange={() => toggleIngredient(ing.OptionID)}
          />
          {`${ing.OptionName} ($${ing.Price.toFixed(2)})`}
        </label>
      ))}

      <button onClick={handleSubmit}>Add Prebuilt Drink</button>
      <button onClick={onClose} style={{ marginLeft: "10px" }}>Close</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default PrebuiltDrinkBuilder;
