import json
from flask import Blueprint, request, jsonify
from backend.db import query_db, execute_db

team_bp = Blueprint('team_bp', __name__)

@team_bp.route('/members', methods=['GET'])
def list_team_members():
    members = query_db("SELECT * FROM team_members ORDER BY id ASC")
    # Parse json columns
    for m in members:
        if isinstance(m.get('responsibilities'), str):
            try:
                m['responsibilities'] = json.loads(m['responsibilities'])
            except Exception:
                pass
        if isinstance(m.get('notifications'), str):
            try:
                m['notifications'] = json.loads(m['notifications'])
            except Exception:
                pass
        if isinstance(m.get('certificates'), str):
            try:
                m['certificates'] = json.loads(m['certificates'])
            except Exception:
                pass

    return jsonify({'status': 'success', 'count': len(members), 'team': members}), 200

@team_bp.route('/members/<member_id>', methods=['GET'])
def get_team_member(member_id):
    m = query_db("SELECT * FROM team_members WHERE id = %s", (member_id,), one=True)
    if not m:
        return jsonify({'error': 'Team member not found', 'status': 404}), 404

    for key in ['responsibilities', 'notifications', 'certificates']:
        if isinstance(m.get(key), str):
            try:
                m[key] = json.loads(m[key])
            except Exception:
                pass

    return jsonify({'status': 'success', 'team_member': m}), 200

@team_bp.route('/members/<member_id>/update-photo', methods=['POST'])
def update_team_photo(member_id):
    data = request.get_json() or {}
    new_photo = data.get('photo_url', '').strip()
    if not new_photo:
        return jsonify({'error': 'photo_url required', 'status': 400}), 400

    m = query_db("SELECT * FROM team_members WHERE id = %s", (member_id,), one=True)
    if not m:
        return jsonify({'error': 'Team member not found', 'status': 404}), 404

    execute_db("UPDATE team_members SET photo_url = %s WHERE id = %s", (new_photo, member_id))
    return jsonify({
        'status': 'success',
        'message': f'Profile photo updated for {m["name"]}',
        'photo_url': new_photo
    }), 200
