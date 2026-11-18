"""Security boundaries for the optional Flask backend, without a real database."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from flask import Flask
from backend.routes import auth_routes, donor_routes, member_routes, team_routes


class BackendSecurityTest(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.register_blueprint(donor_routes.donor_bp, url_prefix='/api/v1/donors')
        app.register_blueprint(member_routes.member_bp, url_prefix='/api/v1/members')
        app.register_blueprint(team_routes.team_bp, url_prefix='/api/v1/team')
        self.client = app.test_client()

    def test_anonymous_access_never_reads_or_mutates_records(self):
        with patch.object(donor_routes, 'query_db') as query, patch.object(team_routes, 'execute_db') as execute:
            self.assertEqual(self.client.get('/api/v1/donors/history?email=someone@example.invalid').status_code, 401)
            self.assertEqual(self.client.get('/api/v1/members').status_code, 401)
            self.assertEqual(self.client.post('/api/v1/team/members/other/update-photo', json={'photo_url': 'https://example.invalid/photo.png'}).status_code, 401)
            self.assertEqual(self.client.post('/api/v1/donors/recurring/other/status', json={'status': 'Cancelled'}).status_code, 401)
            query.assert_not_called()
            execute.assert_not_called()

    def test_expired_or_unbounded_sessions_fail_closed(self):
        for expiry in (None, datetime.now(timezone.utc) - timedelta(minutes=1)):
            with patch.object(auth_routes, 'query_db', return_value={'username': 'fixture', 'expires_at': expiry}):
                self.assertEqual(self.client.get('/api/v1/members', headers={'Authorization': 'Bearer fixture'}).status_code, 401)

    def test_payment_endpoints_cannot_fabricate_receipts_even_for_admin(self):
        session = {'username': 'fixture', 'expires_at': datetime.now(timezone.utc) + timedelta(hours=1)}
        with patch.object(auth_routes, 'query_db', return_value=session), patch.object(donor_routes, 'execute_db') as execute:
            self.assertEqual(self.client.post('/api/v1/donors/donate', headers={'Authorization': 'Bearer fixture'}, json={'amount': 500}).status_code, 409)
            self.assertEqual(self.client.post('/api/v1/members/other/pay-fee', headers={'Authorization': 'Bearer fixture'}, json={'amount': 500}).status_code, 409)
            execute.assert_not_called()


if __name__ == '__main__':
    unittest.main()
