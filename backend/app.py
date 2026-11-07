import os
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.db import get_connection, init_db

def create_app(test_config=None):
    app = Flask(__name__)
    
    if test_config:
        app.config.update(test_config)
    else:
        app.config.from_object(Config)

    # Enable CORS for Next.js frontend
    CORS(app, origins=app.config.get('CORS_ORIGINS', '*'), supports_credentials=True)

    # Health check & status endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_status = 'disconnected'
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                cur.fetchone()
            conn.close()
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'

        return jsonify({
            'status': 'healthy',
            'service': 'GSDD Foundation Flask Backend',
            'version': '1.0.0',
            'database': 'MySQL (gsdd_foundation_db)',
            'database_connection': db_status
        }), 200

    # Auto-initialize database tables if needed
    try:
        init_db()
    except Exception as e:
        print(f"Database bootstrap note: {e}")

    # Register blueprints conditionally as they are imported
    try:
        from backend.routes.auth_routes import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/v1/admin')
    except ImportError:
        pass

    try:
        from backend.routes.gallery_routes import gallery_bp
        app.register_blueprint(gallery_bp, url_prefix='/api/v1/gallery')
    except ImportError:
        pass

    try:
        from backend.routes.certificate_routes import cert_bp
        app.register_blueprint(cert_bp, url_prefix='/api/v1/certificates')
    except ImportError:
        pass

    try:
        from backend.routes.member_routes import member_bp
        app.register_blueprint(member_bp, url_prefix='/api/v1/members')
    except ImportError:
        pass

    try:
        from backend.routes.donor_routes import donor_bp
        app.register_blueprint(donor_bp, url_prefix='/api/v1/donors')
    except ImportError:
        pass

    try:
        from backend.routes.team_routes import team_bp
        app.register_blueprint(team_bp, url_prefix='/api/v1/team')
    except ImportError:
        pass

    try:
        from backend.routes.public_routes import public_bp
        app.register_blueprint(public_bp, url_prefix='/api/v1/public')
    except ImportError:
        pass

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found', 'status': 404}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error', 'status': 500}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('FLASK_PORT', 5000))
    print(f"Starting GSDD Foundation Flask Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)
