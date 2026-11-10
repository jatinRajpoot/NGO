import os
import pymysql
import pymysql.cursors
from backend.config import Config

def get_connection():
    """Returns a PyMySQL connection with DictCursor."""
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
        charset='utf8mb4'
    )

def query_db(query, args=(), one=False):
    """Executes a SELECT query and returns records as dictionaries."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, args)
            rv = cur.fetchall()
            return (rv[0] if rv else None) if one else rv
    finally:
        conn.close()

def execute_db(query, args=()):
    """Executes an INSERT, UPDATE, or DELETE query and returns lastrowid / affected rows."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            affected = cur.execute(query, args)
            last_id = cur.lastrowid
            return {'affected': affected, 'last_id': last_id}
    finally:
        conn.close()

def init_db():
    """Initializes MySQL schema from schema.sql."""
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    if not os.path.exists(schema_path):
        return
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Split commands by semicolon
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
    
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            for stmt in statements:
                if stmt:
                    cur.execute(stmt)
        print("GSDD MySQL Database Schema successfully initialized.")
    finally:
        conn.close()
