import uuid
from flask import Blueprint, request, jsonify
from backend.db import query_db, execute_db
from backend.routes.auth_routes import admin_required

gallery_bp = Blueprint('gallery_bp', __name__)

@gallery_bp.route('', methods=['GET'])
def list_gallery():
    category = request.args.get('category')
    if category and category.lower() != 'all':
        items = query_db(
            "SELECT * FROM gallery_items WHERE is_active = 1 AND category = %s ORDER BY created_at DESC",
            (category,)
        )
    else:
        items = query_db("SELECT * FROM gallery_items WHERE is_active = 1 ORDER BY created_at DESC")

    return jsonify({
        'status': 'success',
        'count': len(items),
        'items': items
    }), 200

@gallery_bp.route('/<item_id>', methods=['GET'])
def get_gallery_item(item_id):
    item = query_db("SELECT * FROM gallery_items WHERE id = %s AND is_active = 1", (item_id,), one=True)
    if not item:
        return jsonify({'error': 'Gallery item not found', 'status': 404}), 404
    return jsonify({'status': 'success', 'item': item}), 200

@gallery_bp.route('', methods=['POST'])
@admin_required
def create_gallery_item():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    category = data.get('category', 'Community Outreach').strip()
    image_url = data.get('image_url', '').strip()
    caption = data.get('caption', '').strip()
    date = data.get('date', '2026-03-01').strip()

    if not title or not image_url:
        return jsonify({'error': 'Title and image_url are required', 'status': 400}), 400

    item_id = 'GAL-' + uuid.uuid4().hex[:8].upper()
    execute_db(
        """
        INSERT INTO gallery_items (id, title, category, image_url, date, caption, uploader, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
        """,
        (item_id, title, category, image_url, date, caption, request.admin_user)
    )

    created = query_db("SELECT * FROM gallery_items WHERE id = %s", (item_id,), one=True)
    return jsonify({'status': 'success', 'message': 'Gallery item created', 'item': created}), 201

@gallery_bp.route('/<item_id>', methods=['DELETE'])
@admin_required
def delete_gallery_item(item_id):
    item = query_db("SELECT * FROM gallery_items WHERE id = %s", (item_id,), one=True)
    if not item:
        return jsonify({'error': 'Gallery item not found', 'status': 404}), 404

    execute_db("UPDATE gallery_items SET is_active = 0 WHERE id = %s", (item_id,))
    return jsonify({'status': 'success', 'message': f'Gallery item {item_id} successfully deleted'}), 200
