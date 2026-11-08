import uuid
from flask import Blueprint, request, jsonify
from backend.db import query_db, execute_db

member_bp = Blueprint('member_bp', __name__)

@member_bp.route('', methods=['GET'])
def list_members():
    members = query_db("SELECT * FROM members ORDER BY created_at DESC")
    return jsonify({'status': 'success', 'count': len(members), 'members': members}), 200

@member_bp.route('/<member_id>', methods=['GET'])
def get_member(member_id):
    member = query_db("SELECT * FROM members WHERE id = %s", (member_id,), one=True)
    if not member:
        return jsonify({'error': 'Member not found', 'status': 404}), 404
    return jsonify({'status': 'success', 'member': member}), 200

@member_bp.route('/register', methods=['POST'])
def register_member():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()

    if not name or not email or not phone:
        return jsonify({'error': 'Name, email, and phone are required', 'status': 400}), 400

    existing = query_db("SELECT * FROM members WHERE email = %s", (email,), one=True)
    if existing:
        return jsonify({'error': 'Member already registered with this email address', 'status': 409}), 409

    member_id = f"MEM-2026-{uuid.uuid4().hex[:4].upper()}"
    id_card_number = f"GSDD-ID-{uuid.uuid4().hex[:6].upper()}"
    membership_type = data.get('membership_type', 'General Contributing Member')
    blood_group = data.get('blood_group', 'O+')
    district = data.get('district', 'Araria')
    state = data.get('state', 'Bihar')

    execute_db(
        """
        INSERT INTO members (
            id, name, email, phone, role, membership_type, status,
            join_date, fee_status, amount_paid, id_card_number,
            blood_group, district, state
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s
        )
        """,
        (
            member_id, name, email, phone, 'Active Member', membership_type, 'Active',
            '07 November 2026', 'Paid', 1200.00, id_card_number,
            blood_group, district, state
        )
    )

    created = query_db("SELECT * FROM members WHERE id = %s", (member_id,), one=True)
    return jsonify({'status': 'success', 'message': 'Membership registered successfully', 'member': created}), 201

@member_bp.route('/<member_id>/id-card', methods=['GET'])
def get_id_card(member_id):
    member = query_db("SELECT * FROM members WHERE id = %s", (member_id,), one=True)
    if not member:
        return jsonify({'error': 'Member not found', 'status': 404}), 404

    card_data = {
        'id_card_number': member['id_card_number'],
        'member_id': member['id'],
        'name': member['name'],
        'role': member['role'],
        'membership_type': member['membership_type'],
        'blood_group': member['blood_group'],
        'district': member['district'],
        'state': member['state'],
        'status': member['status'],
        'issuing_org': 'Global Skills & Digital Development Welfare Foundation (GSDD)',
        'cin': 'U85300BR2024NPL069123',
        'validity': 'Permanent Life Member'
    }
    return jsonify({'status': 'success', 'id_card': card_data}), 200

@member_bp.route('/<member_id>/pay-fee', methods=['POST'])
def pay_fee(member_id):
    member = query_db("SELECT * FROM members WHERE id = %s", (member_id,), one=True)
    if not member:
        return jsonify({'error': 'Member not found', 'status': 404}), 404

    data = request.get_json() or {}
    amount = float(data.get('amount', 1200.00))
    receipt_no = f"RCPT-GSDD-{uuid.uuid4().hex[:6].upper()}"

    execute_db(
        "UPDATE members SET fee_status = 'Paid', amount_paid = amount_paid + %s WHERE id = %s",
        (amount, member_id)
    )

    return jsonify({
        'status': 'success',
        'message': 'Annual membership fee payment recorded',
        'receipt_number': receipt_no,
        'amount_paid': amount,
        'fee_status': 'Paid'
    }), 200
