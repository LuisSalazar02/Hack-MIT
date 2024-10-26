import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
import os

load_dotenv()

connection_pool = None

def init_pool():
    global connection_pool
    if not connection_pool:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME")
        )

def get_connection():
    global connection_pool
    if not connection_pool:
        init_pool()
    return connection_pool.getconn()

def release_connection(conn):
    global connection_pool
    if connection_pool and conn:
        connection_pool.putconn(conn)

def close_pool():
    global connection_pool
    if connection_pool:
        connection_pool.closeall()
