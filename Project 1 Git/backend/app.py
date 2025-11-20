from flask import Flask, jsonify, request
from flask_cors import CORS
from db import get_db_connection, create_order
from werkzeug.security import check_password_hash
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
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT customer_id, password_hash FROM customers WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user or not check_password_hash(user[1], password):
        return jsonify({"error": "Invalid credentials"}), 401
    token = jwt.encode({
        "customer_id": user[0],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({"token": token})

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
    cur.execute("SELECT drink_id, drink_name, base_soda FROM prebuilt_drinks;")
    drinks = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{"DrinkID": d[0], "DrinkName": d[1], "BaseSoda": d[2]} for d in drinks])

@app.route("/sodas", methods=["GET"])
def get_sodas():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT soda_id, soda_name FROM drink_sodas;")
    sodas = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{"SodaID": s[0], "SodaName": s[1]} for s in sodas])

if __name__ == "__main__":
    app.run(debug=True, port=5000)
