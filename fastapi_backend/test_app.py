import unittest
from fastapi.testclient import TestClient
from main import app

class TestPIXITBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")

    def test_api_docs_accessible(self):
        response = self.client.get("/docs")
        self.assertEqual(response.status_code, 200)

if __name__ == "__main__":
    unittest.main()
