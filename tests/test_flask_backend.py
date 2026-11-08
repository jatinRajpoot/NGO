import unittest
import json
from backend.app import create_app

class FlaskBackendTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True})
        self.client = self.app.test_client()

    def test_01_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'healthy')
        self.assertIn('gsdd_foundation_db', data.get('database'))

    def test_02_member_endpoints(self):
        # List members
        res = self.client.get('/api/v1/members')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('count') >= 1)

        # Register a member
        new_mem = {
            'name': 'Pooja Verma',
            'email': 'pooja.verma@example.com',
            'phone': '+91 98765 00099',
            'membership_type': 'General Contributing Member',
            'district': 'Purnia',
            'state': 'Bihar'
        }
        res_reg = self.client.post('/api/v1/members/register', json=new_mem)
        self.assertIn(res_reg.status_code, [201, 409])

        # Get ID card
        res_card = self.client.get('/api/v1/members/MEM-2026-001/id-card')
        self.assertEqual(res_card.status_code, 200)
        card_data = res_card.get_json().get('id_card')
        self.assertEqual(card_data.get('member_id'), 'MEM-2026-001')
        self.assertIn('GSDD', card_data.get('issuing_org'))

    def test_03_donor_endpoints(self):
        # Make a donation
        donation_payload = {
            'donor_name': 'Amit Kumar',
            'email': 'amit.kumar@example.com',
            'phone': '+91 91234 56789',
            'pan': 'ABCDE1234F',
            'amount': 2500,
            'payment_mode': 'UPI',
            'is_recurring': True,
            'frequency': 'monthly'
        }
        res = self.client.post('/api/v1/donors/donate', json=donation_payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'success')
        self.assertIn('tax_benefit', data)
        self.assertTrue(data['tax_benefit']['80g_receipt_number'].startswith('GSDD-80G'))

        # Check donor history
        res_hist = self.client.get('/api/v1/donors/history?email=amit.kumar@example.com')
        self.assertEqual(res_hist.status_code, 200)
        hist_data = res_hist.get_json()
        self.assertTrue(hist_data.get('count') >= 1)

    def test_04_team_endpoints(self):
        # List team
        res = self.client.get('/api/v1/team/members')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('count') >= 2)

        # Get team member details
        res_tm = self.client.get('/api/v1/team/members/TM-001')
        self.assertEqual(res_tm.status_code, 200)
        tm_data = res_tm.get_json().get('team_member')
        self.assertEqual(tm_data.get('id'), 'TM-001')
        self.assertEqual(tm_data.get('name'), 'Manoj Kumar Bishwas')

    def test_05_certificate_endpoints(self):
        # Lookup certificate
        res = self.client.get('/api/v1/certificates/GSDD-ACH-2026-081')
        self.assertEqual(res.status_code, 200)
        cert = res.get_json().get('certificate')
        self.assertEqual(cert.get('recipient'), 'Kavita Kumari')

        # Authenticity Verification - Valid Certificate
        verify_payload = {'id': 'GSDD-ACH-2026-081'}
        res_verify = self.client.post('/api/v1/certificates/verify', json=verify_payload)
        self.assertEqual(res_verify.status_code, 200)
        v_data = res_verify.get_json()
        self.assertTrue(v_data.get('is_authentic'))
        self.assertTrue(v_data.get('is_original'))

        # Authenticity Verification - Fake / Counterfeit Certificate
        fake_payload = {'id': 'FAKE-INVALID-9999'}
        res_fake = self.client.post('/api/v1/certificates/verify', json=fake_payload)
        self.assertEqual(res_fake.status_code, 404)
        f_data = res_fake.get_json()
        self.assertFalse(f_data.get('is_authentic'))
        self.assertEqual(f_data.get('error_code'), 'CERT_UNVERIFIED_OR_FAKE')

if __name__ == '__main__':
    unittest.main()
