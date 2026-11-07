import json
import hashlib
from backend.db import get_connection, init_db

def hash_password(password: str, salt: str = "b97ab09e40b44098ca5db232c9973a08") -> str:
    """Hashes password with SHA-512 compatible with existing admin auth format salt:hash."""
    hashed = hashlib.sha512((password + salt).encode()).hexdigest()
    return f"{salt}:{hashed}"

def seed_database():
    init_db()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Seed Admin User
            admin_pwd = hash_password("admin123")
            cur.execute("""
                INSERT INTO admin_users (username, password_hash, full_name, email, role)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), email=VALUES(email)
            """, ('gsdd-admin', admin_pwd, 'GSDD Chief Administrator', 'admin@gsddfoundation.org', 'Super Administrator'))

            # 2. Seed Verified Certificates
            certificates = [
                (
                    'GSDD-ACH-2026-081',
                    'Kavita Kumari',
                    'kavita.kumari@example.com',
                    'Volunteer Instructor & Community Educator',
                    'Certificate of Excellence & Achievement',
                    'Community Empowerment',
                    '28 February 2026',
                    'Permanent Lifetime Credential',
                    'Jatin Rajpoot (President), GSDD Foundation',
                    'Founder Director & General Secretary',
                    'Global Skills & Digital Development Welfare Foundation',
                    'U85300BR2024NPL069123',
                    'BR/2024/049102',
                    'AABTG1234F',
                    'AAATG2026PF01',
                    'Outstanding contribution in conducting 60 days of free digital literacy workshops for 240+ rural girls in Raniganj block.',
                    'Authentic & Verified',
                    1,
                    'VERIFIED-GSDD-SEC8-081',
                    'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
                    '28 Feb 2026, 04:30 PM IST',
                    'Official Certificate Issued: Certificate of Excellence & Achievement (#GSDD-ACH-2026-081)'
                ),
                (
                    'GSDD-ACH-2026-082',
                    'Manoj Kumar Mandal',
                    'manoj.mandal@example.com',
                    'Community Health Coordinator',
                    'Certificate of Community Impact',
                    'Rural Healthcare',
                    '02 March 2026',
                    'Permanent Lifetime Credential',
                    'Governing Board, GSDD Foundation',
                    'Executive Director & Trustee',
                    'Global Skills & Digital Development Welfare Foundation',
                    'U85300BR2024NPL069123',
                    'BR/2024/049102',
                    'AABTG1234F',
                    'AAATG2026PF01',
                    'Exemplary field leadership in mobilizing 350+ villagers for voluntary blood donation and free multi-specialty health checkups.',
                    'Authentic & Verified',
                    1,
                    'VERIFIED-GSDD-SEC8-082',
                    'SHA256: 4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
                    '02 Mar 2026, 11:15 AM IST',
                    'Official Certificate Issued: Certificate of Community Impact (#GSDD-ACH-2026-082)'
                ),
                (
                    'GSDD-VIS-2026-015',
                    'Shri Anand Prakash IAS (Retd.)',
                    'anand.prakash@example.com',
                    'Chief Guest & Senior Policy Advisor',
                    'Visitor Certificate of Honor & Appreciation',
                    'Distinguished Visitor',
                    '15 February 2026',
                    'Honorary Credential',
                    'Amit Kumar Singh (General Secretary)',
                    'Founder Director & Secretary',
                    'Global Skills & Digital Development Welfare Foundation',
                    'U85300BR2024NPL069123',
                    'BR/2024/049102',
                    'AABTG1234F',
                    'AAATG2026PF01',
                    'Delivering the Keynote Address at the Annual Rural Skill Development Conclave 2026 in Raniganj, Bihar.',
                    'Authentic & Verified',
                    1,
                    'VERIFIED-GSDD-SEC8-VIS-015',
                    'SHA256: ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
                    '15 Feb 2026, 06:00 PM IST',
                    'Certificate of Honor Dispatched: Annual Skill Conclave 2026'
                ),
                (
                    'GSDD-APT-2026-001',
                    'Rajesh Verma',
                    'rajesh.verma@example.com',
                    'Block Education Officer & District Coordinator',
                    'Official Foundation Appointment Letter',
                    'Executive Appointment',
                    '01 January 2026',
                    'Valid for Tenure 2026 - 2028',
                    'Governing Council, GSDD Foundation',
                    'President & Founder Director',
                    'Global Skills & Digital Development Welfare Foundation',
                    'U85300BR2024NPL069123',
                    'BR/2024/049102',
                    'AABTG1234F',
                    'AAATG2026PF01',
                    'Formal statutory executive appointment as District Educational Operations Coordinator for Araria Block.',
                    'Authentic & Verified',
                    1,
                    'VERIFIED-GSDD-SEC8-APT-001',
                    'SHA256: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
                    '01 Jan 2026, 10:00 AM IST',
                    'Official Executive Appointment Order (#GSDD-APT-2026-001)'
                ),
                (
                    'GSDD-M-2026-001',
                    'Dr. Ramesh Kumar Sharma',
                    'ramesh.sharma@example.com',
                    'Patron Life Member',
                    'Official Foundation Membership Certificate',
                    'Institutional Affiliation',
                    '10 January 2026',
                    'Active Lifetime Membership',
                    'Executive Body, GSDD Foundation',
                    'General Secretary & Trustee',
                    'Global Skills & Digital Development Welfare Foundation',
                    'U85300BR2024NPL069123',
                    'BR/2024/049102',
                    'AABTG1234F',
                    'AAATG2026PF01',
                    'Affiliation as Life Patron Benefactor and honorary medical advisory board member of GSDD Foundation.',
                    'Authentic & Verified',
                    1,
                    'VERIFIED-GSDD-SEC8-MEM-001',
                    'SHA256: a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
                    '10 Jan 2026, 02:20 PM IST',
                    'Your Official Foundation Membership Certificate & ID Card'
                )
            ]

            for c in certificates:
                cur.execute("""
                    INSERT INTO certificates (
                        id, recipient, email, role, type, category, issue_date, validity,
                        authority, signatory_title, issuing_organization, cin, mca_reg,
                        pan, tax_80g, purpose, status, is_original, verification_code,
                        hash, email_delivered, email_subject
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE recipient=VALUES(recipient), status=VALUES(status)
                """, c)

            # 3. Seed Team Members
            team_members = [
                (
                    'TM-001',
                    'Manoj Kumar Bishwas',
                    'manoj.bishwas@gsddfoundation.org',
                    '+91 94312 00001',
                    'District Project Lead',
                    'District Operations Lead & Digital Coordinator',
                    'Digital Literacy Division',
                    'Veteran community organizer with 8+ years leading youth skill workshops across Araria, Purnia, and Forbesganj.',
                    '/team/manoj-bishwas.jpg',
                    json.dumps(['Manage district digital labs', 'Coordinate with block development officers', 'Organize bi-weekly placement drives']),
                    json.dumps([{'id': 'notif-1', 'title': 'Q1 Review Completed', 'date': '2026-03-01'}]),
                    json.dumps(['GSDD-ACH-2026-081', 'GSDD-APT-2026-001'])
                ),
                (
                    'TM-002',
                    'Arvind Kumar',
                    'arvind.kumar@gsddfoundation.org',
                    '+91 94312 00002',
                    'Senior Field Officer',
                    'Senior Field Officer & Vocational Trainer',
                    'Vocational Training Division',
                    'Over 6 years empowering women self-help groups with digital marketing, tailoring, and financial literacy training.',
                    '/team/arvind-kumar.jpg',
                    json.dumps(['Oversee rural skill outreach centers', 'Conduct certified digital exams', 'Track student post-training placements']),
                    json.dumps([{'id': 'notif-2', 'title': 'Batch 14 Graduated', 'date': '2026-02-28'}]),
                    json.dumps(['GSDD-ACH-2026-082'])
                )
            ]

            for tm in team_members:
                cur.execute("""
                    INSERT INTO team_members (
                        id, name, email, phone, role, designation, department, bio, photo_url,
                        responsibilities, notifications, certificates
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE name=VALUES(name), designation=VALUES(designation)
                """, tm)

            # 4. Seed Members
            members = [
                (
                    'MEM-2026-001',
                    'Dr. Ramesh Kumar Sharma',
                    'ramesh.sharma@example.com',
                    '+91 98765 43210',
                    'Life Patron Member',
                    'Annual Life Benefactor',
                    'Active',
                    '10 January 2026',
                    'Paid',
                    2500.00,
                    'GSDD-ID-MEM-001',
                    'O+',
                    'Raniganj, Araria',
                    'Bihar'
                ),
                (
                    'MEM-2026-002',
                    'Smt. Sunita Devi',
                    'sunita.devi@example.com',
                    '+91 98765 43211',
                    'Active Member',
                    'General Contributing Member',
                    'Active',
                    '15 January 2026',
                    'Paid',
                    1200.00,
                    'GSDD-ID-MEM-002',
                    'B+',
                    'Forbesganj',
                    'Bihar'
                )
            ]

            for m in members:
                cur.execute("""
                    INSERT INTO members (
                        id, name, email, phone, role, membership_type, status, join_date,
                        fee_status, amount_paid, id_card_number, blood_group, district, state
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE name=VALUES(name), fee_status=VALUES(fee_status)
                """, m)

            # 5. Seed Donors & Donations
            donors = [
                ('DON-2026-001', 'Vikramaditya Roy', 'vikram.roy@example.com', '+91 98111 22334', 'AABCR1234D', 'New Delhi, India', 15000.00),
                ('DON-2026-002', 'Pooja Agarwal', 'pooja.agarwal@example.com', '+91 98222 33445', 'BFGPA9876K', 'Kolkata, India', 5000.00)
            ]
            for d in donors:
                cur.execute("""
                    INSERT INTO donors (id, name, email, phone, pan, address, total_donations)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE name=VALUES(name), total_donations=VALUES(total_donations)
                """, d)

            donations = [
                (
                    'TXN-2026-001',
                    'DON-2026-001',
                    'Vikramaditya Roy',
                    'vikram.roy@example.com',
                    '+91 98111 22334',
                    'AABCR1234D',
                    10000.00,
                    'INR',
                    'UPI/QR',
                    'UPI-982347102938',
                    'Verified',
                    1,
                    'monthly',
                    'GSDD-80G-2026-0101',
                    'GSDD-ACH-2026-081'
                ),
                (
                    'TXN-2026-002',
                    'DON-2026-002',
                    'Pooja Agarwal',
                    'pooja.agarwal@example.com',
                    '+91 98222 33445',
                    'BFGPA9876K',
                    5000.00,
                    'INR',
                    'NetBanking',
                    'NB-882736192834',
                    'Verified',
                    0,
                    'one-time',
                    'GSDD-80G-2026-0102',
                    'GSDD-ACH-2026-082'
                )
            ]
            for dn in donations:
                cur.execute("""
                    INSERT INTO donations (
                        id, donor_id, donor_name, email, phone, pan, amount, currency,
                        payment_mode, transaction_id, status, is_recurring, frequency,
                        receipt_80g_number, certificate_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE status=VALUES(status)
                """, dn)

            # 6. Seed Gallery Items
            gallery = [
                ('GAL-001', 'Free Rural Women Digital Workshop', 'Education & Literacy', '/gallery/workshop-women.jpg', '2026-02-18', 'Over 75 village women learned smartphone banking and safety apps at Raniganj center.', 'Admin Team', 1),
                ('GAL-002', 'Health & Eye Camp in Araria', 'Healthcare', '/gallery/health-camp.jpg', '2026-01-25', 'Free eye checkups, spectacle distribution, and doctor consultations for 300+ seniors.', 'Admin Team', 1)
            ]
            for g in gallery:
                cur.execute("""
                    INSERT INTO gallery_items (id, title, category, image_url, date, caption, uploader, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE title=VALUES(title)
                """, g)

        print("GSDD MySQL Database successfully seeded with all initial records!")
    finally:
        conn.close()

if __name__ == '__main__':
    seed_database()
