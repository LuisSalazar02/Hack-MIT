import sys
import os

# Add the lib directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../lib'))

import asyncpg

connection_pool = None

async def init_pool():
    global connection_pool
    if not connection_pool:
        connection_pool = await asyncpg.create_pool(
            min_size=1,
            max_size=10,
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME")
        )

async def get_connection():
    global connection_pool
    if not connection_pool:
        await init_pool()
    return await connection_pool.acquire()

async def release_connection(conn):
    global connection_pool
    if connection_pool and conn:
        await connection_pool.release(conn)

async def close_pool():
    global connection_pool
    if connection_pool:
        await connection_pool.close()