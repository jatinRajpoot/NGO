import uuid
from flask import Blueprint, request, jsonify
from backend.db import query_db, execute_db

donor_bp = Blueprint('donor_bp', __name__)

@donor_bp.route('/donate', methods=['POST'])
def make_donation():
    data = request.get_json() or {}
    donor_name = data.get('donor_name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    pan = data.get('pan', '').strip()
    amount = float(data.get('amount', 0))
    payment_mode = data.get('payment_mode', 'UPI/QR')
    is_recurring = 1 if data.get('is_recurring') else 0
    frequency = data.get('frequency', 'one-time')

    if not donor_name or not email or amount <= 0:
        return jsonify({'error': 'Donor name, valid email, and positive donation amount are required', 'status': 400}), 400

    # Ensure donor profile exists in donors table
    donor = query_db("SELECT * FROM donors WHERE email = %s", (email,), one=True)
    if not donor:
        donor_id = f"DON-2026-{uuid.uuid4().hex[:4].upper()}"
        execute_db(
            "INSERT INTO donors (id, name, email, phone, pan, total_donations) VALUES (%s, %s, %s, %s, %s, %s)",
            (donor_id, donor_name, email, phone, pan, amount)
        )
    else:
        donor_id = donor['id']
        execute_db("UPDATE donors SET total_donations = total_donations + %s WHERE id = %s", (amount, donor_id))

    donation_id = f"TXN-2026-{uuid.uuid4().hex[:6].upper()}"
    transaction_id = data.get('transaction_id') or f"PAY-{uuid.uuid4().hex[:10].upper()}"
    receipt_80g = f"GSDD-80G-2026-{uuid.uuid4().hex[:5].upper()}"

    execute_db(
        """
        INSERT INTO donations (
            id, donor_id, donor_name, email, phone, pan, amount, currency,
            payment_mode, transaction_id, status, is_recurring, frequency,
            receipt_80g_number
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s
        )
        """,
        (
            donation_id, donor_id, donor_name, email, phone, pan, amount, 'INR',
            payment_mode, transaction_id, 'Verified', is_recurring, frequency,
            receipt_80g
        )
    )

    created_donation = query_db("SELECT * FROM donations WHERE id = %s", (donation_id,), one=True)

    return jsonify({
        'status': 'success',
        'message': 'Donation successfully processed and recorded in MySQL',
        'donation': created_donation,
        'tax_benefit': {
            '80g_receipt_number': receipt_80g,
            'statutory_clause': 'Eligible for 50% deduction under Section 80G of the Income Tax Act, Govt. of India',
            'pan_organization': 'AANCG1860E',
            '80g_order_no': 'AANCG1860EF20261'
        }
    }), 201

@donor_bp.route('/history', methods=['GET'])
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
def update_recurring_status(donation_id):
    """Allows pausing, resuming, or cancelling recurring pledges."""
    data = request.get_json() or {}
    new_status = data.get('status', 'Paused')  # 'Active', 'Paused', 'Cancelled'

    donation = query_db("SELECT * FROM donations WHERE id = %s", (donation_id,), one=True)
    if not donation:
        return jsonify({'error': 'Donation record not found', 'status': 404}), 404

    execute_db("UPDATE donations SET status = %s WHERE id = %s", (new_status, donation_id))
    return jsonify({
        'status': 'success',
        'message': f'Recurring pledge {donation_id} updated to {new_status}',
        'current_status': new_status
    }), 200
