import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Inventory({ onLogout }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ option_type: "", option_name: "", price: 0, inventory: 0 });
  const [editingItem, setEditingItem] = useState(null);
  const [showPrebuiltBuilder, setShowPrebuiltBuilder] = useState(false);
  const [orderDrinks, setOrderDrinks] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [sodas, setSodas] = useState([]);
  const [prebuiltDrinks, setPrebuiltDrinks] = useState([]);
  const [editingDrinkIndex, setEditingDrinkIndex] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Helper function to calculate price from ingredient IDs
  const calculateBasePrice = (ingredientIds, ingredientsList) => {
    return ingredientIds.reduce((sum, id) => {
      const ing = ingredientsList.find(i => i.OptionID === id);
      return sum + (ing ? ing.Price : 0);
    }, 0);
  };

  useEffect(() => {
    fetchInventory();
    fetchIngredients();
    fetchSodas();
  }, []);

  useEffect(() => {
    // Fetch prebuilt drinks only after ingredients are loaded
    if (ingredients.length) fetchPrebuiltDrinks();
  }, [ingredients]);

  const fetchInventory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory(res.data.sort((a, b) => a.OptionID - b.OptionID));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await axios.get("http://localhost:5000/ingredients");
      setIngredients(
        res.data.sort((a, b) => {
          if (a.OptionType < b.OptionType) return -1;
          if (a.OptionType > b.OptionType) return 1;
          return a.OptionID - b.OptionID;
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSodas = async () => {
    try {
      const res = await axios.get("http://localhost:5000/sodas");
      setSodas(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrebuiltDrinks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/prebuilt-drinks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrebuiltDrinks(
        res.data
          .map(d => ({
            DrinkID: d.DrinkID,
            drink_name: d.DrinkName,
            selected_soda: d.BaseSoda,
            ingredients: d.DefaultIngredients || [],
            base_price: calculateBasePrice(d.DefaultIngredients || [], ingredients),
          }))
          .sort((a, b) => a.DrinkID - b.DrinkID)
      );
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await axios.post("http://localhost:5000/inventory", newItem, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewItem({ option_type: "", option_name: "", price: 0, inventory: 0 });
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async id => {
    try {
      await axios.put(`http://localhost:5000/inventory/${id}`, editingItem, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingItem(null);
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async id => {
    try {
      await axios.delete(`http://localhost:5000/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = () => {
    onLogout();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const addDrink = () => {
    setOrderDrinks([...orderDrinks, { drink_name: "", selected_soda: "", ingredients: [], base_price: 0 }]);
    setEditingDrinkIndex(orderDrinks.length);
  };

  const updateDrink = (index, field, value) => {
    const updated = [...orderDrinks];
    if (field === "ingredients") {
      updated[index].ingredients = value;
      updated[index].base_price = calculateBasePrice(value, ingredients);
    } else {
      updated[index][field] = value;
    }
    setOrderDrinks(updated);
  };

  const toggleIngredient = (drinkIndex, ingredientId) => {
    const updated = [...orderDrinks];
    const selected = updated[drinkIndex].ingredients;
    if (selected.includes(ingredientId)) {
      updated[drinkIndex].ingredients = selected.filter(id => id !== ingredientId);
    } else {
      updated[drinkIndex].ingredients.push(ingredientId);
    }
    updated[drinkIndex].base_price = calculateBasePrice(updated[drinkIndex].ingredients, ingredients);
    setOrderDrinks(updated);
  };

  const calculateTotalPrice = drink => {
    return drink.base_price;
  };

  const handleDeletePrebuilt = async (drinkID) => {
  if (!window.confirm("Are you sure you want to delete this prebuilt drink?")) return;
  try {
    await axios.delete(`http://localhost:5000/prebuilt-drinks/${drinkID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPrebuiltDrinks();
    setEditingDrinkIndex(null);
    alert("Prebuilt drink deleted!");
  } catch (err) {
    console.error(err);
  }
};

  const handleAddPrebuilt = async (drink, index) => {
    try {
      if (drink.DrinkID) {
        await axios.put(`http://localhost:5000/prebuilt-drinks/${drink.DrinkID}`, {
          drink_name: drink.drink_name,
          base_soda: drink.selected_soda,
          base_price: drink.base_price,
          ingredients: drink.ingredients,
        }, { headers: { Authorization: `Bearer ${token}` } });
        fetchPrebuiltDrinks();
        setEditingDrinkIndex(null);
        alert("Prebuilt drink updated!");
      } else {
        const res = await axios.post("http://localhost:5000/prebuilt-drinks", {
          drink_name: drink.drink_name,
          base_soda: drink.selected_soda,
          base_price: drink.base_price,
          ingredients: drink.ingredients,
        }, { headers: { Authorization: `Bearer ${token}` } });
        setPrebuiltDrinks([...prebuiltDrinks, { ...drink, DrinkID: res.data.DrinkID }].sort((a, b) => a.DrinkID - b.DrinkID));
        setOrderDrinks([]);
        setEditingDrinkIndex(null);
        alert("Prebuilt drink added!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "auto" }}>
      <h2>Inventory Management</h2>
      <button onClick={handleSignOut}>Sign Out</button>

      <h3>Prebuilt Drinks Builder</h3>
      <button onClick={() => { setShowPrebuiltBuilder(!showPrebuiltBuilder); if (!showPrebuiltBuilder) addDrink(); }}>
        {showPrebuiltBuilder ? "Hide Drink Builder" : "Show Drink Builder"}
      </button>

      {/* Drink Builder */}
      {showPrebuiltBuilder && orderDrinks.map((drink, idx) => (
        <div key={idx} style={{ border: "1px solid #ccc", padding: "10px", marginTop: "10px" }}>
          <input type="text" placeholder="Drink Name" value={drink.drink_name} onChange={e => updateDrink(idx, "drink_name", e.target.value)} />
          <p>Base Price (calculated): ${drink.base_price.toFixed(2)}</p>
          <select value={drink.selected_soda} onChange={e => updateDrink(idx, "selected_soda", e.target.value)}>
            <option value="">Select Base Soda</option>
            {sodas.map(s => <option key={s.SodaID} value={s.SodaID}>{s.SodaName}</option>)}
          </select>
          <p>Ingredients:</p>
          {ingredients.map(ing => (
            <label key={ing.OptionID} style={{ display: "block" }}>
              <input type="checkbox" checked={drink.ingredients.includes(ing.OptionID)} onChange={() => toggleIngredient(idx, ing.OptionID)} />
              {`${ing.OptionName} ($${ing.Price.toFixed(2)}) [${ing.OptionType}]`}
            </label>
          ))}
          <p>Total Price: ${calculateTotalPrice(drink).toFixed(2)}</p>
          <button onClick={() => handleAddPrebuilt(drink, idx)}>
            {drink.DrinkID ? "Update Prebuilt Drink" : "Save Prebuilt Drink"}
          </button>
        </div>
      ))}
      {showPrebuiltBuilder && <button onClick={addDrink}>Add Another Drink</button>}

      {/* Prebuilt Drinks Table */}
      <h3>All Prebuilt Drinks</h3>
      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>Drink ID</th>
            <th>Name</th>
            <th>Base Soda</th>
            <th>Base Price</th>
            <th>Ingredients</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {prebuiltDrinks.map((d, idx) => {
            const isEditing = editingDrinkIndex === idx;
            return (
              <tr key={d.DrinkID}>
                <td>{d.DrinkID}</td>
                <td>{isEditing
                  ? <input value={d.drink_name} onChange={e => updateDrink(idx, "drink_name", e.target.value)} />
                  : d.drink_name}
                </td>
                <td>{isEditing
                  ? <select value={d.selected_soda} onChange={e => updateDrink(idx, "selected_soda", e.target.value)}>
                      <option value="">Select Base Soda</option>
                      {sodas.map(s => <option key={s.SodaID} value={s.SodaID}>{s.SodaName}</option>)}
                    </select>
                  : sodas.find(s => s.SodaID === d.selected_soda)?.SodaName || ""}
                </td>
                <td>${d.base_price.toFixed(2)}</td>
                <td>{isEditing
                  ? ingredients.map(ing => (
                      <label key={ing.OptionID} style={{ display: "block" }}>
                        <input type="checkbox" checked={d.ingredients.includes(ing.OptionID)} onChange={() => toggleIngredient(idx, ing.OptionID)} />
                        {`${ing.OptionName} (${ing.OptionType})`}
                      </label>
                    ))
                  : d.ingredients.map(id => ingredients.find(i => i.OptionID === id)?.OptionName).filter(Boolean).join(", ")}
                </td>
                <td>
                    {isEditing
                        ? <>
                            <button onClick={() => handleAddPrebuilt(d, idx)}>Save</button>
                            <button onClick={() => setEditingDrinkIndex(null)}>Cancel</button>
                            <button onClick={() => handleDeletePrebuilt(d.DrinkID)}>Delete</button>
                        </>
                    : <button onClick={() => setEditingDrinkIndex(idx)}>Edit</button>
                    }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Inventory Table */}
      <h3>Add New Inventory Item</h3>
      <input type="text" placeholder="Option Type" value={newItem.option_type} onChange={e => setNewItem({ ...newItem, option_type: e.target.value })} />
      <input type="text" placeholder="Option Name" value={newItem.option_name} onChange={e => setNewItem({ ...newItem, option_name: e.target.value })} />
      <input type="number" placeholder="Price" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })} />
      <input type="number" placeholder="Inventory" value={newItem.inventory} onChange={e => setNewItem({ ...newItem, inventory: parseInt(e.target.value) })} />
      <button onClick={handleAdd}>Add Item</button>

      <h3>Current Inventory</h3>
      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>Option ID</th>
            <th>Type</th>
            <th>Name</th>
            <th>Price</th>
            <th>Inventory</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map(item => (
            <tr key={item.OptionID} style={{
                    backgroundColor: item.Inventory > 50 ? '#c8e6c9'  // green
                  : item.Inventory > 25  ? '#fff9c4'  // yellow
                  : '#ffcdd2'                       // red
            }}>

              <td>{item.OptionID}</td>
              <td>{editingItem?.OptionID === item.OptionID
                ? <input value={editingItem.option_type} onChange={e => setEditingItem({ ...editingItem, option_type: e.target.value })} />
                : item.OptionType}
              </td>
              <td>{editingItem?.OptionID === item.OptionID
                ? <input value={editingItem.option_name} onChange={e => setEditingItem({ ...editingItem, option_name: e.target.value })} />
                : item.OptionName}
              </td>
              <td>{editingItem?.OptionID === item.OptionID
                ? <input type="number" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })} />
                : item.Price}
              </td>
              <td>{editingItem?.OptionID === item.OptionID
                ? <input type="number" value={editingItem.inventory} onChange={e => setEditingItem({ ...editingItem, inventory: parseInt(e.target.value) })} />
                : item.Inventory}
              </td>
              <td>
                {editingItem?.OptionID === item.OptionID
                  ? <>
                      <button onClick={() => handleUpdate(item.OptionID)}>Save</button>
                      <button onClick={() => setEditingItem(null)}>Cancel</button>
                    </>
                  : <>
                      <button onClick={() => setEditingItem({ ...item, OptionID: item.OptionID })}>Edit</button>
                      <button onClick={() => handleDelete(item.OptionID)}>Delete</button>
                    </>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Inventory;
