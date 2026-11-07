import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'gsdd-foundation-flask-secret-key-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'gsdd-jwt-secret-key-928471928374')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    
    # MySQL Database Config
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'bharti')
    MYSQL_DB = os.getenv('MYSQL_DB', 'gsdd_foundation_db')
    
    # SQLite fallback path for local isolated tests if MySQL is unavailable
    SQLITE_PATH = os.path.join(os.path.dirname(__file__), 'gsdd_foundation.sqlite')
    
    # Server configuration
    PORT = int(os.getenv('FLASK_PORT', 5000))
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1')
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
