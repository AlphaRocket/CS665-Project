import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("PGDATABASE"),
        user=os.getenv("PGUSER"),
        password=os.getenv("PGPASSWORD"),
        host=os.getenv("PGHOST"),
        port=os.getenv("PGPORT")
    )

def create_order(customer_id, order_drinks):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO orders (customer_id, order_date, total_price)
        VALUES (%s, NOW(), 0)
        RETURNING order_id;
        """,
        (customer_id,)
    )
    order_id = cur.fetchone()[0]

    total_price = 0

    for drink in order_drinks:
        size = drink["size"]
        drink_id = drink["drink_id"]
        selected_soda = drink.get("selected_soda")
        customer_notes = drink.get("customer_notes", "")

        cur.execute(
            """
            INSERT INTO order_drinks (order_id, drink_id, size, selected_soda, customer_notes)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING order_drink_id;
            """,
            (order_id, drink_id, size, selected_soda, customer_notes)
        )

        # TODO: Calculate real price based on drink selections
        total_price += 1.00

    cur.execute(
        """
        UPDATE orders
        SET total_price = %s
        WHERE order_id = %s;
        """,
        (total_price, order_id)
    )

    conn.commit()
    cur.close()
    conn.close()
    return order_id
