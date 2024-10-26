import json
from . import db_pool

async def read(event, context):
    await db_pool.init_pool()
    conn = db_pool.get_connection()
    try:
        item_id = event['pathParameters']['id']
        result = await conn.fetch('SELECT * FROM your_table LIMIT 1')
        if result:
            return {
                "statusCode": 200,
                "body": json.dumps({"id": result[0], "presupuesto_actual": result[1]})
            }
        else:
            return {"statusCode": 404, "body": "User not found"}
    finally:
        db_pool.release_connection(conn)