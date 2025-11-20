from flask import Flask, jsonify, request
from flask_cors import CORS
from db import get_db_connection, create_order

app = Flask(__name__)
CORS(app)

@app.route("/drinks", methods=["GET"])
def get_drinks():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT drink_id, drink_name, base_soda FROM prebuilt_drinks;")
    drinks = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([
        {"DrinkID": d[0], "DrinkName": d[1], "BaseSoda": d[2]}
        for d in drinks
    ])

@app.route("/sodas", methods=["GET"])
def get_sodas():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT soda_id, soda_name FROM base_sodas;")
    sodas = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([
        {"SodaID": s[0], "SodaName": s[1]}
        for s in sodas
    ])

@app.route("/orders", methods=["POST"])
def create_order_route():
    data = request.json
    customer_id = data.get("customer_id")
    order_drinks = data.get("order_drinks", [])

    if not customer_id or not isinstance(order_drinks, list):
        return jsonify({"error": "Invalid request"}), 400

    order_id = create_order(customer_id, order_drinks)
    return jsonify({"order_id": order_id}), 201

if __name__ == "__main__":
    app.run(debug=True, port=5000)
