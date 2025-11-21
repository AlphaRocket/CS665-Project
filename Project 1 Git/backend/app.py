from flask import Flask, jsonify, request
from flask_cors import CORS
from db import get_db_connection, create_order
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your_super_secret_key_here'

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            user_id = data.get("user_id")
            user_type = data.get("user_type")

            if not user_id or not user_type:
                return jsonify({"error": "Invalid token payload"}), 401

            kwargs['current_user_id'] = user_id
            kwargs['current_user_type'] = user_type

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated

# --------------------------
# Login
# --------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cur = conn.cursor()

    # Check employees table first
    cur.execute('SELECT employeeid, "password" FROM employees WHERE email = %s;', (email,))
    row = cur.fetchone()
    if row:
        user_id, stored_password = row
        user_type = "employee"
    else:
        # Check customers table
        cur.execute('SELECT customer_id, "password" FROM customers WHERE email = %s;', (email,))
        row = cur.fetchone()
        if row:
            user_id, stored_password = row
            user_type = "customer"
        else:
            cur.close()
            conn.close()
            return jsonify({"error": "Invalid email or password"}), 401

    cur.close()
    conn.close()

    if password != stored_password:
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode(
        {
            "user_id": user_id,
            "user_type": user_type,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        },
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )
    return jsonify({"token": token}), 200

# --------------------------
# Customer Orders
# --------------------------
@app.route("/orders", methods=["POST"])
@token_required
def create_order_route(current_user_id, current_user_type):
    if current_user_type != "customer":
        return jsonify({"error": "Only customers can create orders"}), 403

    data = request.json
    order_drinks = data.get("order_drinks", [])
    if not isinstance(order_drinks, list):
        return jsonify({"error": "Invalid request"}), 400

    order_id = create_order(current_user_id, order_drinks)
    return jsonify({"order_id": order_id}), 201

# --------------------------
# Drinks (Customer View)
# --------------------------
@app.route("/drinks", methods=["GET"])
def get_drinks():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT drink_id, drink_name, base_soda, base_price FROM prebuilt_drinks;")
    drinks = cur.fetchall()
    result = []

    for d in drinks:
        drink_id, name, base_soda, base_price = d
        cur.execute("SELECT option_id FROM prebuilt_drink_selections WHERE drink_id = %s;", (drink_id,))
        default_ids = [r[0] for r in cur.fetchall()]

        cur.execute("SELECT option_name FROM drink_options WHERE option_id = ANY(%s);", (default_ids,))
        default_names = [r[0] for r in cur.fetchall()]

        result.append({
            "DrinkID": drink_id,
            "DrinkName": name,
            "BaseSoda": base_soda,
            "BasePrice": float(base_price) if base_price is not None else 0.0,
            "DefaultIngredients": default_ids,
            "DefaultIngredientsNames": default_names
        })

    cur.close()
    conn.close()
    return jsonify(result)

# --------------------------
# Ingredients & Sodas
# --------------------------
@app.route("/ingredients", methods=["GET"])
def get_ingredients():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT option_id, option_type, option_name, price, inventory FROM drink_options WHERE inventory > 0;")
    options = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{
        "OptionID": o[0],
        "OptionType": o[1],
        "OptionName": o[2],
        "Price": float(o[3]),
        "Inventory": o[4]
    } for o in options])

@app.route("/sodas", methods=["GET"])
def get_sodas():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT "soda_id", "soda_name" FROM "drink_sodas";')
    sodas = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{"SodaID": s[0], "SodaName": s[1]} for s in sodas])

# --------------------------
# Inventory CRUD (Employee)
# --------------------------
@app.route("/inventory", methods=["GET"])
@token_required
def get_inventory(current_user_id, current_user_type):
    if current_user_type != "employee":
        return jsonify({"error": "Access denied"}), 403
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT option_id, option_type, option_name, price, inventory FROM drink_options ORDER BY option_type, option_name;")
    inventory = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{
        "OptionID": i[0],
        "OptionType": i[1],
        "OptionName": i[2],
        "Price": float(i[3]),
        "Inventory": i[4]
    } for i in inventory])

@app.route("/inventory", methods=["POST"])
@token_required
def add_inventory_item(current_user_id, current_user_type):
    if current_user_type != "employee":
        return jsonify({"error": "Access denied"}), 403
    data = request.json
    option_type = data.get("option_type")
    option_name = data.get("option_name")
    price = data.get("price")
    inventory_count = data.get("inventory", 0)
    if not option_name or price is None:
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO drink_options (option_type, option_name, price, inventory) VALUES (%s, %s, %s, %s) RETURNING option_id;",
            (option_type, option_name, price, inventory_count)
        )
        option_id = cur.fetchone()[0]
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"error": str(e)}), 400

    cur.close()
    conn.close()
    return jsonify({"message": "Inventory item added", "OptionID": option_id}), 201

@app.route("/inventory/<int:option_id>", methods=["PUT"])
@token_required
def update_inventory_item(current_user_id, current_user_type, option_id):
    if current_user_type != "employee":
        return jsonify({"error": "Access denied"}), 403
    data = request.json
    option_type = data.get("option_type")
    option_name = data.get("option_name")
    price = data.get("price")
    inventory_count = data.get("inventory")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        updates = []
        values = []

        if option_type is not None:
            updates.append("option_type = %s")
            values.append(option_type)
        if option_name is not None:
            updates.append("option_name = %s")
            values.append(option_name)
        if price is not None:
            updates.append("price = %s")
            values.append(price)
        if inventory_count is not None:
            updates.append("inventory = %s")
            values.append(inventory_count)

        if not updates:
            return jsonify({"error": "No fields to update"}), 400

        values.append(option_id)
        query = f"UPDATE drink_options SET {', '.join(updates)} WHERE option_id = %s;"
        cur.execute(query, values)
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"error": str(e)}), 400

    cur.close()
    conn.close()
    return jsonify({"message": "Inventory item updated"}), 200

@app.route("/inventory/<int:option_id>", methods=["DELETE"])
@token_required
def delete_inventory_item(current_user_id, current_user_type, option_id):
    if current_user_type != "employee":
        return jsonify({"error": "Access denied"}), 403
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM drink_options WHERE option_id = %s;", (option_id,))
        if cur.rowcount == 0:
            return jsonify({"error": "Item not found"}), 404
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"error": str(e)}), 400

    cur.close()
    conn.close()
    return jsonify({"message": "Inventory item deleted"}), 200

# --------------------------
# Prebuilt Drinks CRUD (Employee)
# --------------------------
@app.route("/prebuilt-drinks", methods=["POST"])
@token_required
def add_prebuilt_drink(current_user_id, current_user_type):
    if current_user_type != "employee":
        return jsonify({"error": "Access denied"}), 403
    data = request.json
    drink_name = data.get("drink_name")
    base_soda = data.get("base_soda")
    base_price = data.get("base_price", 0.0)
    ingredient_ids = data.get("ingredients", [])

    if not drink_name or base_soda is None:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO prebuilt_drinks (drink_name, base_soda, base_price) VALUES (%s, %s, %s) RETURNING drink_id;",
            (drink_name, base_soda, base_price)
        )
        drink_id = cur.fetchone()[0]
        for option_id in ingredient_ids:
            cur.execute(
                "INSERT INTO prebuilt_drink_selections (drink_id, option_id) VALUES (%s, %s);",
                (drink_id, option_id)
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"error": str(e)}), 400

    cur.close()
    conn.close()
    return jsonify({"message": "Prebuilt drink added", "DrinkID": drink_id}), 201

@app.route("/prebuilt-drinks", methods=["GET"])
@token_required
def get_prebuilt_drinks(current_user_id, current_user_type):
    if current_user_type != "employee":
        return jsonify({"error": "Access denied"}), 403
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT drink_id, drink_name, base_soda, base_price FROM prebuilt_drinks;")
    drinks = cur.fetchall()
    result = []
    for d in drinks:
        drink_id, name, base_soda, base_price = d
        cur.execute("SELECT option_id FROM prebuilt_drink_selections WHERE drink_id = %s;", (drink_id,))
        default_ids = [r[0] for r in cur.fetchall()]
        result.append({
            "DrinkID": drink_id,
            "DrinkName": name,
            "BaseSoda": base_soda,
            "BasePrice": float(base_price) if base_price is not None else 0.0,
            "DefaultIngredients": default_ids
        })
    cur.close()
    conn.close()
    return jsonify(result)

@app.route("/prebuilt-drinks/<int:drink_id>", methods=["PUT"])
@token_required
def update_prebuilt_drink(current_user_id, current_user_type, drink_id):
    if current_user_type != "employee":
        return jsonify({"error": "Access denied"}), 403
    data = request.json
    drink_name = data.get("drink_name")
    base_soda = data.get("base_soda")
    base_price = data.get("base_price")
    ingredients = data.get("ingredients")  # full replacement

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        updates = []
        values = []
        if drink_name is not None:
            updates.append("drink_name = %s")
            values.append(drink_name)
        if base_soda is not None:
            updates.append("base_soda = %s")
            values.append(base_soda)
        if base_price is not None:
            updates.append("base_price = %s")
            values.append(base_price)

        if updates:
            values.append(drink_id)
            cur.execute(f"UPDATE prebuilt_drinks SET {', '.join(updates)} WHERE drink_id = %s;", tuple(values))

        if ingredients is not None:
            cur.execute("DELETE FROM prebuilt_drink_selections WHERE drink_id = %s;", (drink_id,))
            for option_id in ingredients:
                cur.execute(
                    "INSERT INTO prebuilt_drink_selections (drink_id, option_id) VALUES (%s, %s);",
                    (drink_id, option_id)
                )
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"error": str(e)}), 400

    cur.close()
    conn.close()
    return jsonify({"message": "Prebuilt drink updated"}), 200

@app.route("/prebuilt-drinks/<int:drink_id>", methods=["DELETE"])
@token_required
def delete_prebuilt_drink(current_user_id, current_user_type, drink_id):
    if current_user_type != "employee":
        return jsonify({"error": "Access denied"}), 403
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM prebuilt_drink_selections WHERE drink_id = %s;", (drink_id,))
        cur.execute("DELETE FROM prebuilt_drinks WHERE drink_id = %s;", (drink_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"error": str(e)}), 400

    cur.close()
    conn.close()
    return jsonify({"message": "Prebuilt drink deleted"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)
