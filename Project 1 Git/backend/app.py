from flask import Flask, jsonify
from flask_cors import CORS
from db import conn

app = Flask(__name__)
CORS(app)

@app.route("/drinks", methods=["GET"])
def get_drinks():
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM PrebuiltDrinks;")
    drinks = cursor.fetchall()
    cursor.close()
    return jsonify([{"DrinkID": d[0], "DrinkName": d[1], "BasePrice": float(d[2])} for d in drinks])

if __name__ == "__main__":
    app.run(debug=True, port=5000)
