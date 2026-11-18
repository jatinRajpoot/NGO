"""Exercise the optional Flask application with isolated database fixtures."""
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app import create_app
from backend.routes import auth_routes, certificate_routes, member_routes, team_routes


class FlaskBackendTest(unittest.TestCase):
    def setUp(self):
        with patch("backend.app.init_db"):
            self.client = create_app({"TESTING": True}).test_client()
        self.headers = {"Authorization": "Bearer integration-fixture"}
        session = {"username": "fixture", "expires_at": datetime.now(timezone.utc) + timedelta(hours=1)}
        db = patch.object(auth_routes, "query_db", return_value=session)
        db.start()
        self.addCleanup(db.stop)

    def test_health_checks_the_database(self):
        connection = MagicMock()
        with patch("backend.app.get_connection", return_value=connection):
            response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["database_connection"], "connected")
        connection.close.assert_called_once()

        with patch("backend.app.get_connection", side_effect=ConnectionError("fixture unavailable")):
            with self.assertLogs(level="ERROR"):
                response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json(), {"status": "unhealthy", "database_connection": "unavailable"})

    def test_authorized_member_and_team_reads(self):
        with patch.object(member_routes, "query_db", return_value=[{"id": "MEM-FIXTURE"}]):
            response = self.client.get("/api/v1/members", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["members"], [{"id": "MEM-FIXTURE"}])
        with patch.object(team_routes, "query_db", return_value={"id": "TEAM-FIXTURE", "name": "Team Fixture"}):
            response = self.client.get("/api/v1/team/members/TEAM-FIXTURE", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["team_member"]["name"], "Team Fixture")

    def test_donation_shortcut_stays_disabled(self):
        response = self.client.post("/api/v1/donors/donate", headers=self.headers, json={"amount": 500})
        self.assertEqual(response.status_code, 409)

    def test_certificate_lookup_and_verification(self):
        record = {
            "id": "CERT-FIXTURE", "recipient": "Certificate Fixture", "is_original": True,
            "status": "Verified", "issuing_organization": "Fixture", "cin": "FIXTURE",
            "mca_reg": "FIXTURE", "pan": "FIXTURE", "tax_80g": "FIXTURE", "authority": "Fixture",
        }
        with patch.object(certificate_routes, "query_db", return_value=record):
            result = self.client.get("/api/v1/certificates/CERT-FIXTURE")
            self.assertEqual(result.get_json()["certificate"]["recipient"], "Certificate Fixture")
            result = self.client.post("/api/v1/certificates/verify", json={"id": "CERT-FIXTURE"})
            self.assertEqual(result.status_code, 200)
            self.assertTrue(result.get_json()["is_authentic"])
        with patch.object(certificate_routes, "query_db", return_value=None):
            result = self.client.post("/api/v1/certificates/verify", json={"id": "NOT-FOUND"})
            self.assertEqual(result.status_code, 404)
            self.assertFalse(result.get_json()["is_authentic"])


if __name__ == "__main__":
    unittest.main()
