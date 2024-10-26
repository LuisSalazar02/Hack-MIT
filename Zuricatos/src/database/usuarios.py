import json
import db_pool

def read(event, context):
    conn = db_pool.get_connection()
    try:
        item_id = event['pathParameters']['id']
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM items WHERE id = %s;", (item_id,))
            item = cur.fetchone()
        if item:
            return {
                "statusCode": 200,
                "body": json.dumps({"id": item[0], "presupuesto_actual": item[1]})
            }
        else:
            return {"statusCode": 404, "body": "User not found"}
    finally:
        db_pool.release_connection(conn)