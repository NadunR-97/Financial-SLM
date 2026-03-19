import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os
import shutil

# --- CONFIGURATION ---
# We check all these paths to find Tesseract
POSSIBLE_PATHS = [
    r'C:\Program Files\Tesseract-OCR',
    r'C:\Program Files (x86)\Tesseract-OCR',
    r'C:\Program Files\Tesseract',        # <--- Added for you
    r'C:\Program Files (x86)\Tesseract',  # <--- Added for you (Likely match)
    r'C:\Users\Nadun Rathnayake\AppData\Local\Tesseract-OCR' # Common user install
]

BASE_PATH = None
for path in POSSIBLE_PATHS:
    if os.path.exists(path):
        BASE_PATH = path
        break

# If not found in folders, check system PATH
if not BASE_PATH:
    system_path = shutil.which("tesseract")
    if system_path:
        ENGINE_PATH = system_path
        DATA_PATH = os.path.dirname(system_path) # Assumes tessdata is next to exe
        BASE_PATH = "System Path"
    else:
        ENGINE_PATH = None
else:
    ENGINE_PATH = os.path.join(BASE_PATH, "tesseract.exe")
    DATA_PATH = os.path.join(BASE_PATH, "tessdata")

if ENGINE_PATH and os.path.exists(ENGINE_PATH):
    pytesseract.pytesseract.tesseract_cmd = ENGINE_PATH
    if os.path.exists(DATA_PATH):
        os.environ['TESSDATA_PREFIX'] = DATA_PATH
    TESSERACT_AVAILABLE = True
    print(f"[OK] Tesseract Configured.\n   -> Engine: {ENGINE_PATH}")
else:
    TESSERACT_AVAILABLE = False
    print("[WARNING] CRITICAL: Tesseract not found.")
    print("   -> Please install it from: https://github.com/UB-Mannheim/tesseract/wiki")

def extract_text_from_pdf_bytes(pdf_bytes: bytes):
    """
    Parses a PDF and returns a LIST of pages.
    Format: [{"page": 1, "text": "..."}, {"page": 2, "text": "..."}]
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_data = []

    print(f"Processing PDF with {len(doc)} pages...")

    for i, page in enumerate(doc):
        text = page.get_text()

        # Fallback to OCR if the page looks like a scanned image (little to no text)
        if len(text.strip()) < 50: 
            if TESSERACT_AVAILABLE:
                try:
                    # Render page as an image
                    pix = page.get_pixmap(dpi=300)
                    img_data = pix.tobytes("png")
                    img = Image.open(io.BytesIO(img_data))
                    
                    # Run OCR
                    ocr_text = pytesseract.image_to_string(img, lang='eng')
                    text = f"[OCR READ]\n{ocr_text}"
                except Exception as e:
                    print(f"   -> Page {i+1} OCR Failed: {e}")
                    text = "[Image Content - OCR Failed]"
            else:
                text = "[Scanned Image - OCR Not Available]"

        # Add structure: Page Number + Text
        pages_data.append({
            "page": i + 1,
            "text": text
        })

    return pages_data