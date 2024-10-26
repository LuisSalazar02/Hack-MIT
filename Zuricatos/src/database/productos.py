import json
from . import db_pool

def create(event, context):
    conn = db_pool.get_connection()
    try:
        data = json.loads(event['body'])
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO productos (producto_nombre, marca, descripcion, precio_compra, cantidad) VALUES (%s, %s, %s, %s, %s);",
                (data['producto_nombre'], data['marca'], data['descripcion'], data['precio_compra'], data['cantidad'])
            )
            item_id = cur.fetchone()[0]
            conn.commit()
        return {
            "statusCode": 201,
            "body": "Product created successfully"
        }
    except:
        return {
            "statusCode": 400,
            "body": "Product creation failure"
        }

    finally:
        db_pool.release_connection(conn)

def read(event, context):
    conn = db_pool.get_connection()
    try:
        item_id = event['pathParameters']['id']
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM productos WHERE id = %s;", (item_id,))
            item = cur.fetchone()
        if item:
            return {
                "statusCode": 200,
                "body": json.dumps({"id": item[0], "producto_nombre": item[1], "marca": item[2], "descripcion": item[3], "precio_compra": item[4], \
                "cantidad": item[5]})
            }
        else:
            return {"statusCode": 404, "body": "Product not found"}
    finally:
        db_pool.release_connection(conn)

def update_cantidad(event, context):
    conn = db_pool.get_connection()
    try:
        item_id = event['pathParameters']['id']
        data = json.loads(event['body'])
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE productos SET cantidad = %s WHERE id = %s;",
                (data['name'], data['description'], item_id)
            )
            conn.commit()
        return {"statusCode": 200, "body": "Product updated successfully"}
    except:
        return {
            "statusCode": 400,
            "body": "Product update failure"
        }

    finally:
        db_pool.release_connection(conn)

def delete(event, context):
    conn = db_pool.get_connection()
    try:
        item_id = event['pathParameters']['id']
        with conn.cursor() as cur:
            cur.execute("DELETE FROM productos WHERE id = %s;", (item_id,))
            conn.commit()
        return {"statusCode": 204}
    except:
        return {
            "statusCode": 400,
            "body": "Product deletion failure"
        }

    finally:
        db_pool.release_connection(conn)
