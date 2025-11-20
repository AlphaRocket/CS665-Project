import React, { useState } from "react";
import Login from "./Login";
import Orders from "./Orders";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  return (
    <div>
      {loggedIn ? (
        <Orders />
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;
