import uuid
from flask import Blueprint, request, jsonify
from backend.db import query_db, execute_db
from backend.routes.auth_routes import admin_required

donor_bp = Blueprint('donor_bp', __name__)

@donor_bp.route('/donate', methods=['POST'])
@admin_required
def make_donation():
    return jsonify({'error': 'Use the Next.js donation submission and administrator reconciliation workflow. No payment is collected by this API.'}), 409

@donor_bp.route('/history', methods=['GET'])
@admin_required
def donor_history():
    email = request.args.get('email', '').strip()
    if not email:
        return jsonify({'error': 'Email parameter is required', 'status': 400}), 400

    donations = query_db("SELECT * FROM donations WHERE LOWER(email) = LOWER(%s) ORDER BY created_at DESC", (email,))
    donor = query_db("SELECT * FROM donors WHERE LOWER(email) = LOWER(%s)", (email,), one=True)

    return jsonify({
        'status': 'success',
        'donor': donor,
        'count': len(donations),
        'donations': donations
    }), 200

@donor_bp.route('/recurring/<donation_id>/status', methods=['POST'])
@admin_required
def update_recurring_status(donation_id):
    """Allows pausing, resuming, or cancelling recurring pledges."""
    data = request.get_json() or {}
    new_status = data.get('status', 'Paused')  # 'Active', 'Paused', 'Cancelled'

    if new_status not in ('Active', 'Paused', 'Cancelled'):
        return jsonify({'error': 'Invalid recurring status'}), 400
    donation = query_db("SELECT * FROM donations WHERE id = %s", (donation_id,), one=True)
    if not donation:
        return jsonify({'error': 'Donation record not found', 'status': 404}), 404

    execute_db("UPDATE donations SET status = %s WHERE id = %s", (new_status, donation_id))
    return jsonify({
        'status': 'success',
        'message': f'Recurring pledge {donation_id} updated to {new_status}',
        'current_status': new_status
    }), 200
