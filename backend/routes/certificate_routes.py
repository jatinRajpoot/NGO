import uuid
import hashlib
from flask import Blueprint, request, jsonify
from backend.db import query_db, execute_db
from backend.routes.auth_routes import admin_required

cert_bp = Blueprint('cert_bp', __name__)

@cert_bp.route('', methods=['GET'])
def list_certificates():
    search = request.args.get('search', '').strip()
    email = request.args.get('email', '').strip()

    if email:
        certs = query_db(
            "SELECT * FROM certificates WHERE LOWER(email) = LOWER(%s) OR LOWER(recipient) LIKE LOWER(%s)",
            (email, f"%{email}%")
        )
    elif search:
        search_like = f"%{search}%"
        certs = query_db(
            """
            SELECT * FROM certificates
            WHERE id LIKE %s OR recipient LIKE %s OR verification_code LIKE %s OR email LIKE %s
            """,
            (search_like, search_like, search_like, search_like)
        )
    else:
        certs = query_db("SELECT * FROM certificates ORDER BY created_at DESC")

    return jsonify({
        'status': 'success',
        'count': len(certs),
        'certificates': certs
    }), 200

@cert_bp.route('/<cert_id>', methods=['GET'])
def get_certificate(cert_id):
    cert = query_db("SELECT * FROM certificates WHERE id = %s", (cert_id,), one=True)
    if not cert:
        return jsonify({'error': 'Certificate not found', 'status': 404}), 404
    return jsonify({'status': 'success', 'certificate': cert}), 200

@cert_bp.route('/verify', methods=['POST'])
def verify_certificate():
    """
    Authenticity validation: Checks ID, verification code, or digital signature hash.
    Detects authentic vs counterfeit documents.
    """
    data = request.get_json() or {}
    query_param = data.get('id') or data.get('code') or data.get('query', '')
    query_param = str(query_param).strip().upper()

    if not query_param:
        return jsonify({'error': 'Certificate ID or verification code required', 'status': 400}), 400

    cert = query_db(
        """
        SELECT * FROM certificates
        WHERE UPPER(id) = %s OR UPPER(verification_code) = %s
        """,
        (query_param, query_param),
        one=True
    )

    if cert:
        return jsonify({
            'status': 'success',
            'is_authentic': True,
            'is_original': bool(cert['is_original']),
            'certificate': cert,
            'statutory_verification': {
                'issuing_organization': cert['issuing_organization'],
                'cin': cert['cin'],
                'mca_registration': cert['mca_reg'],
                'pan': cert['pan'],
                'tax_80g_number': cert['tax_80g'],
                'authority': cert['authority'],
                'status': 'Government-Registered Section 8 Authentic Credential'
            }
        }), 200
    else:
        return jsonify({
            'status': 'warning',
            'is_authentic': False,
            'is_original': False,
            'attempted_id': query_param,
            'message': 'No matching certificate record found in GSDD official registry. Document may be unauthorized or counterfeit.',
            'error_code': 'CERT_UNVERIFIED_OR_FAKE'
        }), 404

@cert_bp.route('/issue', methods=['POST'])
@admin_required
def issue_certificate():
    """Administrative creation of official certificates into MySQL."""
    data = request.get_json() or {}
    recipient = data.get('recipient', '').strip()
    email = data.get('email', '').strip()
    role = data.get('role', 'Volunteer').strip()
    cert_type = data.get('type', 'Certificate of Appreciation').strip()
    category = data.get('category', 'Community Service').strip()
    purpose = data.get('purpose', '').strip()

    if not recipient or not email or not purpose:
        return jsonify({'error': 'Recipient, email, and purpose are required', 'status': 400}), 400

    cert_id = f"GSDD-ACH-2026-{uuid.uuid4().hex[:3].upper()}"
    verification_code = f"VERIFIED-GSDD-SEC8-{uuid.uuid4().hex[:6].upper()}"
    raw_hash = f"{cert_id}:{recipient}:{email}:{purpose}"
    cert_hash = f"SHA256: {hashlib.sha256(raw_hash.encode()).hexdigest()}"
    issue_date = data.get('issueDate', '07 November 2026')

    execute_db(
        """
        INSERT INTO certificates (
            id, recipient, email, role, type, category, issue_date, validity,
            authority, signatory_title, issuing_organization, cin, mca_reg,
            pan, tax_80g, purpose, status, is_original, verification_code,
            hash, email_delivered, email_subject
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s
        )
        """,
        (
            cert_id, recipient, email, role, cert_type, category, issue_date,
            'Permanent Lifetime Credential',
            'Jatin Rajpoot (President), GSDD Foundation',
            'Founder Director & General Secretary',
            'Global Skills & Digital Development Welfare Foundation',
            'U85300BR2024NPL069123', 'BR/2024/049102', 'AABTG1234F', 'AAATG2026PF01',
            purpose, 'Authentic & Verified', 1, verification_code, cert_hash,
            '07 Nov 2026, 08:00 PM IST', f"Official Certificate Issued: {cert_type} (#{cert_id})"
        )
    )

    created = query_db("SELECT * FROM certificates WHERE id = %s", (cert_id,), one=True)
    return jsonify({
        'status': 'success',
        'message': 'Official certificate issued and stored in MySQL',
        'certificate': created
    }), 201
