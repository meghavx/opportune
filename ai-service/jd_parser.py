from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile
from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from pypdf import PdfReader
from pypdf.errors import PdfReadError

def extract_jd_text(filename: str, file_bytes: bytes) -> str:
    if not file_bytes:
        raise ValueError("The uploaded file is empty.")

    extension = Path(filename).suffix.lower()

    if extension == ".pdf":
        try:
            reader = PdfReader(BytesIO(file_bytes))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except PdfReadError as exc:
            raise ValueError("The PDF is invalid or encrypted.") from exc

    elif extension == ".docx":
        try:
            document = Document(BytesIO(file_bytes))
        except (BadZipFile, PackageNotFoundError) as exc:
            raise ValueError("The DOCX file is invalid.") from exc

        parts = [paragraph.text for paragraph in document.paragraphs]

        for table in document.tables:
            for row in table.rows:
                parts.append(" | ".join(cell.text for cell in row.cells))

        text = "\n".join(parts)

    else:
        raise ValueError("Only PDF and DOCX files are supported.")

    text = text.strip()

    if not text:
        raise ValueError(
            "No readable text was found. Scanned PDFs are not supported yet."
        )

    return text