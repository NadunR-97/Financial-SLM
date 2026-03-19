import sys
from PyPDF2 import PdfReader

def extract_pdf_pages(pdf_path, start_page, end_page, output_txt):
    try:
        reader = PdfReader(pdf_path)
        print(f"Total pages: {len(reader.pages)}")
        
        # PyPDF2 is 0-indexed. User wants 76 to 150, so indices 75 to 149.
        # But let's be safe and adjust mathematically.
        start_idx = max(0, start_page - 1)
        end_idx = min(len(reader.pages), end_page)
        
        extracted_text = []
        for i in range(start_idx, end_idx):
            page_text = reader.pages[i].extract_text()
            if page_text:
                extracted_text.append(f"--- PAGE {i+1} ---\n{page_text}")
                
        with open(output_txt, 'w', encoding='utf-8') as f:
            f.write("\n".join(extracted_text))
            
        print(f"Successfully extracted pages {start_page} to {end_page} into {output_txt}")
    except Exception as e:
        print(f"Error extracting PDF: {e}")

if __name__ == "__main__":
    pdf_file = "Punchawariyage Pancha.pdf"
    out_file = "pdf_extract.txt"
    extract_pdf_pages(pdf_file, 76, 150, out_file)
