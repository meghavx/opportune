import json
import unittest
from io import BytesIO
from unittest.mock import patch
import httpx
from docx import Document
from fastapi.testclient import TestClient
from main import app

class FakeOllamaResponse:
    def __init__(self, content: str) -> None:
        self.content = content

    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict:
        return {"message": {"content": self.content}}

class FakeOllamaClient:
    def __init__(self, content: str = "", error: Exception | None = None) -> None:
        self.content = content
        self.error = error
        self.request_data: dict[str, object] | None = None
        self.request_url: str | None = None

    async def __aenter__(self) -> "FakeOllamaClient":
        return self

    async def __aexit__(self, *_: object) -> bool:
        return False

    async def post(
        self,
        _url: str,
        *,
        json: dict[str, object],
    ) -> FakeOllamaResponse:
        if self.error:
            raise self.error

        self.request_url = _url
        self.request_data = json
        return FakeOllamaResponse(self.content)

def ollama_fields(department: str | None = None) -> str:
    return json.dumps({
        "job_role": "Backend Developer",
        "job_description": "Backend development role in Bengaluru.",
        "package_offered": 12,
        "location": "Bengaluru",
        "eligibility": {
            "min_cgpa": 7.5,
            "department": department,
            "max_backlogs": 0,
            "graduation_year": 2027,
        },
    })

class ExtractDriveDetailsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_extracts_fields_and_adds_review_warnings(self) -> None:
        fake_ollama = FakeOllamaClient(ollama_fields())

        with patch("main.httpx.AsyncClient", return_value=fake_ollama):
            response = self.client.post(
                "/extract-drive-details",
                json={
                    "text": (
                        "Northstar Analytics is hiring a Backend Developer "
                        "in Bengaluru. Salary is 12 LPA. Applicants must have "
                        "at least 7.5 CGPA, no active backlogs, and be "
                        "graduating in 2027."
                    )
                },
            )

        self.assertEqual(response.status_code, 200)
        result = response.json()

        self.assertEqual(result["job_role"], "Backend Developer")
        self.assertEqual(result["package_offered"], 12)
        self.assertEqual(result["location"], "Bengaluru")
        self.assertEqual(result["eligibility"]["min_cgpa"], 7.5)
        self.assertEqual(result["eligibility"]["max_backlogs"], 0)
        self.assertEqual(result["eligibility"]["graduation_year"], 2027)
        self.assertIsNone(result["eligibility"]["department"])
        self.assertTrue(any("department" in warning for warning in result["warnings"]))
        self.assertTrue(any("drive date" in warning for warning in result["warnings"]))

    def test_multiple_departments_are_not_reduced_to_one(self) -> None:
        fake_ollama = FakeOllamaClient(ollama_fields(department="CSE"))

        with patch("main.httpx.AsyncClient", return_value=fake_ollama):
            response = self.client.post(
                "/extract-drive-details",
                json={"text": "CSE or IT graduates may apply."},
            )

        self.assertEqual(response.status_code, 200)
        result = response.json()

        self.assertIsNone(result["eligibility"]["department"])
        self.assertTrue(
            any("multiple departments" in warning for warning in result["warnings"])
        )

    def test_selects_earliest_batch_and_stricter_cgpa_with_warnings(self) -> None:
        fake_ollama = FakeOllamaClient(ollama_fields())
        job_description = (
            "Fresher (2025 & 2026 batches). Minimum 70% aggregate or CGPA 7.0. "
            "Minimum aggregate 65% marks or CGPA 6.5 in graduation."
        )

        with patch("main.httpx.AsyncClient", return_value=fake_ollama):
            response = self.client.post(
                "/extract-drive-details",
                json={"text": job_description},
            )

        self.assertEqual(response.status_code, 200)
        eligibility = response.json()["eligibility"]
        warnings = response.json()["warnings"]
        self.assertEqual(eligibility["graduation_year"], 2025)
        self.assertEqual(eligibility["min_cgpa"], 7.0)
        self.assertTrue(any("different CGPA cutoffs" in warning for warning in warnings))
        self.assertTrue(
            any("multiple eligible graduation years" in warning for warning in warnings)
        )

    def test_empty_text_is_rejected_without_calling_ollama(self) -> None:
        with patch("main.httpx.AsyncClient") as ollama_client:
            response = self.client.post(
                "/extract-drive-details",
                json={"text": ""},
            )

        self.assertEqual(response.status_code, 422)
        ollama_client.assert_not_called()

    def test_ollama_connection_error_returns_503(self) -> None:
        error = httpx.ConnectError(
            "Ollama is unavailable",
            request=httpx.Request("POST", "http://localhost:11434/api/chat"),
        )
        fake_ollama = FakeOllamaClient(error=error)

        with patch("main.httpx.AsyncClient", return_value=fake_ollama):
            response = self.client.post(
                "/extract-drive-details",
                json={"text": "Hiring a Backend Developer."},
            )

        self.assertEqual(response.status_code, 503)

    def test_invalid_ollama_json_returns_502(self) -> None:
        fake_ollama = FakeOllamaClient('{"job_role":"Backend Developer"}')

        with patch("main.httpx.AsyncClient", return_value=fake_ollama):
            response = self.client.post(
                "/extract-drive-details",
                json={"text": "Hiring a Backend Developer."},
            )

        self.assertEqual(response.status_code, 502)

    def test_docx_upload_is_extracted_and_sent_to_ollama(self) -> None:
        document_bytes = BytesIO()
        document = Document()
        document.add_paragraph("Backend Developer in Bengaluru")
        document.save(document_bytes)

        fake_ollama = FakeOllamaClient(ollama_fields())
        with patch("main.httpx.AsyncClient", return_value=fake_ollama):
            response = self.client.post(
                "/extract-drive-details/file",
                files={
                    "file": (
                        "job-description.docx",
                        document_bytes.getvalue(),
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    )
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["job_role"], "Backend Developer")
        self.assertIsNotNone(fake_ollama.request_url)
        self.assertTrue(str(fake_ollama.request_url).endswith("/api/chat"))
        self.assertIsNotNone(fake_ollama.request_data)
        self.assertIn(
            "Backend Developer in Bengaluru",
            str(fake_ollama.request_data),
        )

    def test_file_upload_rejects_unsupported_extension(self) -> None:
        with patch("main.httpx.AsyncClient") as ollama_client:
            response = self.client.post(
                "/extract-drive-details/file",
                files={"file": ("job.doc", b"job description", "application/msword")},
            )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Only PDF and DOCX", response.json()["detail"])
        ollama_client.assert_not_called()

    def test_file_upload_rejects_files_over_size_limit(self) -> None:
        with patch("main.httpx.AsyncClient") as ollama_client:
            response = self.client.post(
                "/extract-drive-details/file",
                files={"file": ("job.docx", b"x" * (5 * 1024 * 1024 + 1))},
            )

        self.assertEqual(response.status_code, 413)
        self.assertIn("5 MB limit", response.json()["detail"])
        ollama_client.assert_not_called()


if __name__ == "__main__":
    unittest.main()