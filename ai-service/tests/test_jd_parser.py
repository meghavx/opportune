import unittest
from io import BytesIO
from docx import Document
from jd_parser import extract_jd_text

class ExtractJdTextTests(unittest.TestCase):
    def test_extracts_text_from_docx_paragraphs_and_tables(self) -> None:
        output = BytesIO()
        document = Document()
        document.add_paragraph("Backend Developer")
        table = document.add_table(rows=1, cols=2)
        table.cell(0, 0).text = "Location"
        table.cell(0, 1).text = "Bengaluru"
        document.save(output)
        text = extract_jd_text("job.docx", output.getvalue())
        self.assertIn("Backend Developer", text)
        self.assertIn("Location | Bengaluru", text)

    def test_rejects_unsupported_extension(self) -> None:
        with self.assertRaisesRegex(ValueError, "Only PDF and DOCX"):
            extract_jd_text("job.doc", b"some file data")

    def test_rejects_empty_file(self) -> None:
        with self.assertRaisesRegex(ValueError, "file is empty"):
            extract_jd_text("job.pdf", b"")

    def test_rejects_invalid_pdf(self) -> None:
        with self.assertRaisesRegex(ValueError, "PDF is invalid"):
            extract_jd_text("job.pdf", b"not a PDF")

if __name__ == "__main__":
    unittest.main()