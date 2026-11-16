import uuid
import hashlib
import functools
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Blueprint, request, jsonify
from backend.db import query_db, execute_db

auth_bp = Blueprint('auth_bp', __name__)

def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        return check_password_hash(stored_hash, plain_password)
    except (ValueError, TypeError):
        return False


def hash_new_password(plain_password: str) -> str:
    return generate_password_hash(plain_password, method='scrypt')


def admin_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        session_id = None
        if auth_header.startswith('Bearer '):
            session_id = auth_header.split(' ', 1)[1].strip()
        elif 'admin_session' in request.cookies:
            session_id = request.cookies.get('admin_session')

        if not session_id:
            return jsonify({'error': 'Unauthorized: Admin authentication token required', 'status': 401}), 401

        session = query_db(
            "SELECT * FROM admin_sessions WHERE session_id = %s AND revoked = 0",
            (session_id,),
            one=True
        )
        expiry = session.get('expires_at') if session else None
        if isinstance(expiry, str):
            try:
                expiry = datetime.fromisoformat(expiry)
            except ValueError:
                expiry = None
        if expiry and expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if not session or not expiry or expiry <= datetime.now(timezone.utc):
            return jsonify({'error': 'Unauthorized: Session revoked or invalid', 'status': 401}), 401

        if not auth_header.startswith('Bearer ') and request.method not in ('GET', 'HEAD', 'OPTIONS') and request.headers.get('Origin', '').rstrip('/') != request.host_url.rstrip('/'):
            return jsonify({'error': 'Forbidden origin'}), 403
        request.admin_user = session['username']
        request.admin_session_id = session_id
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password are required', 'status': 400}), 400

    admin = query_db("SELECT * FROM admin_users WHERE username = %s", (username,), one=True)
    if not admin or not verify_password(password, admin['password_hash']):
        return jsonify({'error': 'Invalid administrative credentials', 'status': 401}), 401

    session_id = uuid.uuid4().hex + uuid.uuid4().hex
    token_preview = session_id[:8] + '...'
    execute_db(
        "INSERT INTO admin_sessions (session_id, username, token_preview, revoked, expires_at) VALUES (%s, %s, %s, 0, %s)",
        (session_id, username, token_preview, datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=8))
    )

    resp = jsonify({
        'status': 'success',
        'message': 'Authentication successful',
        'token': session_id,
        'user': {
            'username': admin['username'],
            'full_name': admin['full_name'],
            'email': admin['email'],
            'role': admin['role']
        }
    })
    resp.set_cookie('admin_session', session_id, httponly=True, secure=request.is_secure, samesite='Lax', max_age=28800)
    return resp, 200

@auth_bp.route('/auth/logout', methods=['POST'])
@admin_required
def logout():
    session_id = request.admin_session_id
    execute_db("UPDATE admin_sessions SET revoked = 1 WHERE session_id = %s", (session_id,))
    resp = jsonify({'status': 'success', 'message': 'Admin session successfully revoked server-side'})
    resp.delete_cookie('admin_session')
    return resp, 200

@auth_bp.route('/auth/profile', methods=['GET', 'PUT'])
@admin_required
def profile():
    if request.method == 'GET':
        admin = query_db(
            "SELECT username, full_name, email, role, created_at, updated_at FROM admin_users WHERE username = %s",
            (request.admin_user,),
            one=True
        )
        return jsonify({'status': 'success', 'profile': admin}), 200

    data = request.get_json() or {}
    full_name = data.get('full_name')
    email = data.get('email')

    if full_name and email:
        execute_db(
            "UPDATE admin_users SET full_name = %s, email = %s WHERE username = %s",
            (full_name, email, request.admin_user)
        )
    return jsonify({'status': 'success', 'message': 'Admin profile updated'}), 200

@auth_bp.route('/auth/change-password', methods=['POST'])
@admin_required
def change_password():
    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not old_password or not new_password or len(new_password) < 6:
        return jsonify({'error': 'Valid old password and new password (min 6 chars) are required', 'status': 400}), 400

    admin = query_db("SELECT * FROM admin_users WHERE username = %s", (request.admin_user,), one=True)
    if not admin or not verify_password(old_password, admin['password_hash']):
        return jsonify({'error': 'Current password verification failed', 'status': 403}), 403

    new_hash = hash_new_password(new_password)
    execute_db("UPDATE admin_users SET password_hash = %s WHERE username = %s", (new_hash, request.admin_user))
    # Revoke old sessions
    execute_db("UPDATE admin_sessions SET revoked = 1 WHERE username = %s AND session_id != %s", (request.admin_user, request.admin_session_id))

    return jsonify({'status': 'success', 'message': 'Administrative password successfully updated'}), 200
