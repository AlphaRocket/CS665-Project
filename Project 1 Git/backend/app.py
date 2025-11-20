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
            current_user_id = data['customer_id']
        except:
            return jsonify({"error": "Token is invalid"}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT "customer_id", "password" FROM "customers" WHERE "email" = %s;', (email,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if row is None:
        return jsonify({"error": "Invalid email or password"}), 401

    customer_id, stored_password = row

    if password != stored_password:
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode(
        {"customer_id": customer_id, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )

    return jsonify({"token": token}), 200

@app.route("/orders", methods=["POST"])
@token_required
def create_order_route(current_user_id):
    data = request.json
    order_drinks = data.get("order_drinks", [])
    if not isinstance(order_drinks, list):
        return jsonify({"error": "Invalid request"}), 400
    order_id = create_order(current_user_id, order_drinks)
    return jsonify({"order_id": order_id}), 201

@app.route("/drinks", methods=["GET"])
def get_drinks():
    conn = get_db_connection()
    cur = conn.cursor()

    # Get all prebuilt drinks
    cur.execute("""
        SELECT drink_id, drink_name, base_soda, base_price
        FROM prebuilt_drinks;
    """)
    drinks = cur.fetchall()

    result = []

    for d in drinks:
        drink_id, name, base_soda, base_price = d

        # Fetch default ingredient option_ids
        cur.execute("""
            SELECT option_id
            FROM prebuilt_drink_selections
            WHERE drink_id = %s;
        """, (drink_id,))
        default_ids = [r[0] for r in cur.fetchall()]

        # Fetch option names for convenience (optional)
        cur.execute("""
            SELECT option_name
            FROM drink_options
            WHERE option_id = ANY(%s);
        """, (default_ids,))
        default_names = [r[0] for r in cur.fetchall()]

        result.append({
            "DrinkID": drink_id,
            "DrinkName": name,
            "BaseSoda": base_soda,
            "BasePrice": float(base_price) if base_price else 0.00,
            "DefaultIngredients": default_ids,
            "DefaultIngredientsNames": default_names
        })

    cur.close()
    conn.close()

    return jsonify(result)


@app.route("/sodas", methods=["GET"])
def get_sodas():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT "soda_id", "soda_name" FROM "drink_sodas";')
    sodas = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{"SodaID": s[0], "SodaName": s[1]} for s in sodas])

@app.route("/ingredients", methods=["GET"])
def get_ingredients():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT option_id, option_type, option_name, price, inventory
        FROM drink_options
        WHERE inventory > 0;
    """)
    options = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "OptionID": o[0],
            "OptionType": o[1],
            "OptionName": o[2],
            "Price": float(o[3]),
            "Inventory": o[4]
        } for o in options
    ])

if __name__ == "__main__":
    app.run(debug=True, port=5000)
