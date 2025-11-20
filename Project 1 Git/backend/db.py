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
        ingredients = drink.get("ingredients", [])

        cur.execute(
            """
            INSERT INTO order_drinks (order_id, drink_id, size, selected_soda, customer_notes)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING order_drink_id;
            """,
            (order_id, drink_id, size, selected_soda, customer_notes)
        )
        order_drink_id = cur.fetchone()[0]

        for option_id in ingredients:
            cur.execute(
                """
                INSERT INTO order_drink_selections (order_drink_id, option_id)
                VALUES (%s, %s);
                """,
                (order_drink_id, option_id)
            )

            cur.execute(
                """
                UPDATE drink_options
                SET inventory = inventory - 1
                WHERE option_id = %s AND inventory > 0;
                """,
                (option_id,)
            )

        total_price += 1.00 + 0.50 * len(ingredients)

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
