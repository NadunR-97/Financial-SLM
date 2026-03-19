import chromadb
from sentence_transformers import SentenceTransformer, CrossEncoder
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi
import numpy as np
from google import genai
from google.genai import types
import uuid
import os
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

from app.config import get_settings

settings = get_settings()

# --- CONFIGURATION ---
# GOOGLE_API_KEY is now loaded from settings

# --- INITIALIZE CLIENT ---
try:
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)
except Exception as e:
    print(f"[ERROR] Error initializing Google Client: {e}")
    client = None

# --- AUTO-DETECT WORKING MODEL ---
POSSIBLE_MODELS = [
    "gemini-2.5-flash",       
    "gemini-3-flash",         
    "gemini-2.5-flash-lite",  
    "gemini-1.5-flash",       
    "gemini-1.5-pro",         
]

ACTIVE_MODEL_NAME = None

print("\n--- [INIT] FINDING WORKING AI MODEL ---")
if client:
    for model_name in POSSIBLE_MODELS:
        try:
            print(f"   [*] Testing: {model_name}...", end=" ")
            client.models.generate_content(model=model_name, contents="Hello")
            print("[OK] WORKING!")
            ACTIVE_MODEL_NAME = model_name
            break 
        except Exception:
            print("[FAILED] Failed.")

    if not ACTIVE_MODEL_NAME:
        print("[WARNING] CRITICAL: All models failed. Defaulting to 'gemini-1.5-flash'.")
        ACTIVE_MODEL_NAME = "gemini-1.5-flash"
    else:
        print(f"[SUCCESS] System locked onto: {ACTIVE_MODEL_NAME}")
print("----------------------------------\n")


# Setup Vector DB
db_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
collection = db_client.get_or_create_collection(name="financial_docs")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# --- RE-RANKER MODEL ---
# Only load if we are doing re-ranking (consumes memory)
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# --- IN-MEMORY BM25 INDEX (For Hybrid Search) ---
# Note: In a real production system, this should be persisted (e.g., using Elasticsearch or Redis)
# For this prototype, we rebuild it on startup or keep it simple.
# Given the "stateful" nature of this python process, we can keep a global index if the dataset isn't huge.
bm25_index = None
bm25_corpus = [] # List of text chunks
bm25_ids = []    # List of Corresponding IDs

# --- INTEGRITY FUNCTION ---
def check_document_exists(file_hash: str):
    results = collection.get(
        where={"file_hash": file_hash},
        limit=1
    )
    return len(results['ids']) > 0

# --- SMART CHUNKER ---
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ".", " ", ""]
)

# --- ASYNC MEMORY FUNCTION ---
async def add_to_memory(filename: str, pages_data: list, file_hash: str = "no_hash_provided"):
    """
    Async function to process and store document chunks.
    """
    loop = asyncio.get_event_loop()
    # Run the heavy processing in a thread pool to avoid blocking the event loop
    return await loop.run_in_executor(None, _process_and_store, filename, pages_data, file_hash)

def _process_and_store(filename: str, pages_data: list, file_hash: str):
    documents = []
    embeddings = []
    metadatas = []
    ids = []
    
    # 1. Combine text for smarter splitting (optional, but per-page is safer for citation)
    # We will split per page to keep page numbers accurate
    
    print(f"Memorizing {len(pages_data)} pages from {filename}...")

    for page in pages_data:
        page_num = page['page']
        text = page['text']
        
        # Use Smart Splitter
        chunks = text_splitter.split_text(text)
        
        if chunks:
            # Batch encode for speed
            page_embeddings = embedding_model.encode(chunks).tolist()
            
            for i, chunk in enumerate(chunks):
                doc_id = f"{file_hash}_p{page_num}_{uuid.uuid4()}"
                documents.append(chunk)
                embeddings.append(page_embeddings[i])
                metadatas.append({
                    "source": filename, 
                    "page": page_num,
                    "file_hash": file_hash 
                })
                ids.append(doc_id)
                
                # Update BM25 Global Index (Naive implementation for prototype)
                # In strict prod, use a thread-safe update or separate service
                global bm25_corpus, bm25_ids, bm25_index
                bm25_corpus.append(chunk)
                bm25_ids.append(doc_id)

    if documents:
        collection.add(documents=documents, embeddings=embeddings, metadatas=metadatas, ids=ids)
        # Rebuild BM25 Index (Expensive for large docs, optimize later)
        tokenized_corpus = [doc.split(" ") for doc in bm25_corpus]
        bm25_index = BM25Okapi(tokenized_corpus)
    
    return len(documents)

# --- HYBRID SEARCH FUNCTION ---
def search_memory(query: str, n_results: int = 10): 
    # 1. Vector Search (Semantic)
    query_embedding = embedding_model.encode([query]).tolist()
    
    try:
        vector_results = collection.query(
            query_embeddings=query_embedding,
            n_results=n_results * 2 # Fetch more for re-ranking
        )
    except Exception as e:
        print(f"Vector DB Error: {e}")
        return []
    
    # Process Vector Results
    candidates = {} # Map ID -> Note
    
    if vector_results['documents']:
        for i, doc_id in enumerate(vector_results['ids'][0]):
            doc = vector_results['documents'][0][i]
            meta = vector_results['metadatas'][0][i]
            candidates[doc_id] = {
                "text": doc,
                "meta": meta,
                "score": 0.0 # Will be updated by re-ranker
            }

    # 2. Keyword Search (BM25) - Optional Enhancement
    # Note: Requires keeping bm25_index in sync. If too complex, skip for Phase 1.
    # For now, we rely on Vector + Re-ranking which is usually sufficient.
    
    # 3. Re-Ranking (Cross Encoder)
    if not candidates:
        return []

    candidate_ids = list(candidates.keys())
    candidate_texts = [candidates[id]["text"] for id in candidate_ids]
    
    # Create pairs: [Query, Text]
    pairs = [[query, text] for text in candidate_texts]
    
    # Score pairs
    scores = reranker.predict(pairs)
    
    # Update scores and sort
    final_results = []
    for i, doc_id in enumerate(candidate_ids):
        candidates[doc_id]["score"] = float(scores[i])
        final_results.append(candidates[doc_id])
        
    # Sort by score (Descending)
    final_results.sort(key=lambda x: x["score"], reverse=True)
    
    # Format Top N
    formatted_output = []
    for res in final_results[:n_results]:
        source = res["meta"].get('source', 'Unknown File')
        page = res["meta"].get('page', '?')
        score = round(res["score"], 3)
        formatted_output.append(f"SOURCE: {source} (Page {page}) [Rel: {score}]\nCONTENT: {res['text']}")
            
    return formatted_output

# --- UPGRADED CHAT ANSWER (STRUCTURED + CITATION) ---
def generate_answer(query: str):
    facts = search_memory(query)
    
    if not facts:
        return "I couldn't find any relevant financial data in your documents."

    context_str = "\n\n----------------\n\n".join(facts)
    
    # 👇 CoT Prompt with Citation Enforcement
    prompt = f"""
    You are a Senior Financial Analyst. Answer the user's question using **ONLY** the context provided below.
    
    ### USER QUESTION: 
    "{query}"
    
    ### CRITICAL FORMATTING INSTRUCTIONS (MARKDOWN):
    1. **Tables**: If presenting multiple numbers or data comparisons, YOU MUST USE MARKDOWN TABLES.
       Example:
       | Metric | FY2023 | FY2022 | Source |
       |---|---|---|---|
       | Revenue | 10M | 8M | Report A |
    
    2. **Headings**: Use Level 3 Headings (`###`) for sections like "Executive Summary" or "Financial Analysis".
    
    3. **Bold/Italic**: Use bold (`**text**`) for key figures and concepts.
    
    4. **Lists**: Use standard markdown lists for risk factors or key points.

    ### INSTRUCTIONS:
    1. **Think Step-by-Step**: Break down the question and find the relevant numbers in the context.
    2. **Cite Everything**: Every fact or number MUST be followed by its source. Example: "Revenue was $10M (Annual Report 2023, Page 12)".
    3. **Be Concise**: Do not waffle. Get similar output format to a professional memo.
    
    --- CONTEXT DATA ---
    {context_str}
    """

    try:
        response = client.models.generate_content(
            model=ACTIVE_MODEL_NAME, 
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Error talking to Gemini ({ACTIVE_MODEL_NAME}): {e}"

# --- NEW: CRIB DATA EXTRACTOR ---
def extract_crib_data(context_text: str):
    """
    Uses the LLM to scan for CRIB report details and return a structured JSON object.
    """
    prompt = f"""
    You are a data extraction bot. Read the following text extracted from financial and CRIB documents.
    Extract the following standard CRIB metrics. Return ONLY a valid JSON object. Do not include markdown formatting like ```json.
    
    Required JSON Schema:
    {{
        "total_facilities": <int>,
        "total_overdue_amount": <float>,
        "worst_status_code": <int> (e.g., 0 for no delays, 1+ for delayed days, 9 for bad debt),
        "has_historical_defaults": <boolean>
    }}
    
    If the document does not contain CRIB information, return zeroes/false.
    
    --- TEXT ---
    {context_text[:30000]} 
    """
    try:
        response = client.models.generate_content(
            model=ACTIVE_MODEL_NAME, 
            contents=prompt
        )
        
        # Clean potential markdown
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)
        return data
    except Exception as e:
        print(f"CRIB Extraction Error: {e}")
        return {
            "total_facilities": 0,
            "total_overdue_amount": 0.0,
            "worst_status_code": 0,
            "has_historical_defaults": False
        }

# --- CREDIT APPRAISAL ENGINE (UPDATED WITH CRIB SCORE) ---
def generate_credit_appraisal(profile: str, amount: str, tenure: str, rate: str, security: str, context_text: str):
    
    # 1. Extract CRIB Numbers First
    crib_data = extract_crib_data(context_text)
    print(f"📊 Extracted CRIB Data: {crib_data}")
    
    # 2. Re-using the prompt logic from original file for consistency
    original_prompt = f"""
    You are a Senior Credit Risk Officer at a Tier-1 Bank. 
    Perform a Comprehensive Credit Appraisal based on the provided inputs and documents.

    ### INPUT DATA:
    1. **Customer Profile:** {profile}
    2. **Proposed Loan Amount:** {amount}
    3. **Proposed Tenure:** {tenure} months
    4. **Proposed Interest Rate:** {rate}%
    5. **Proposed Security:** {security}
    
    ### EXTRACTED CRIB DATA:
    * Total Facilities: {crib_data.get('total_facilities', 0)}
    * Total Overdue Amount: {crib_data.get('total_overdue_amount', 0.0)}
    * Worst Status Code: {crib_data.get('worst_status_code', 0)}
    * Historical Defaults: {crib_data.get('has_historical_defaults', False)}
    
    ### DOCUMENT CONTEXT (Financials):
    {context_text[:40000]}

    ### STRICT BANKING RULES:
    1. If `Total Overdue Amount` is > 0, the maximum possible CREDIT RATING is **4 (Weak)**. Do not recommend.
    2. If `Worst Status Code` is >= 2, the maximum possible CREDIT RATING is **3 (Average)**.
    3. If there are `Historical Defaults`, heavily penalize the rating.
    
    ### ANALYSIS REQUIREMENTS:
    1. **Financial Health:** Analyze profitability, liquidity (Current Ratio), and solvency (Debt-to-Equity).
    2. **Repayment Capacity Evaluation:** 
       - Estimate the monthly installment for the proposed loan of {amount} over {tenure} months at {rate}%.
       - Extract all existing/ongoing loan facilities and their monthly commitments from the CRIB and Financials.
       - Calculate Total Debt Service (Proposed Installment + Existing Installments).
       - Evaluate if the declared income/cash flows can comfortably cover the Total Debt Service (DSCR).
    3. **Credit History:** Explicitly comment on the extracted CRIB parameters.
    4. **Security Coverage:** Is the "{security}" sufficient?

    ### REQUIRED OUTPUT FORMAT (Strictly follow this):
    
    **1. CREDIT RATING:** [Score 1-5]
    *(Scale: 1=Outstanding, 2=Good, 3=Average, 4=Weak, 5=Poor)*
    
    **2. MANAGEMENT DECISION:** [RECOMMENDED / REJECTED / CONDITIONAL]
    
    **3. REPAYMENT CAPACITY EVALUATION:**
    * **Proposed Installment Estimate:** [Rs. X / month]
    * **Existing Commitments:** [List extracted ongoing facilities]
    * **DSCR / Cash Flow Analysis:** [State if total obligations are met by income]
    
    **4. KEY RISK FACTORS (Mandatory Categories):**
    * **Credit Risk:** [Analyze borrower's creditworthiness and CRIB data]
    * **Security Risk:** [Analyze the quality and coverage of {security}]
    * **Business Risk:** [Analyze industry, market, and business model risks]
    * **Management Risk:** [Analyze experience and competence of the management team]
    * **Structural Risk:** [Analyze the loan structure, tenure, and covenants]
    
    **4. DETAILED APPRAISAL:**
    [Provide a 2-paragraph professional justification covering Financial Performance and CRIB Status.]
    """

    try:
        response = client.models.generate_content(
            model=ACTIVE_MODEL_NAME, 
            contents=original_prompt
        )
        return response.text
    except Exception as e:
        return f"Error Generating Appraisal: {e}"

# --- NEW: LIST FILES ---
def list_uploaded_files():
    """
    Returns a list of unique filenames currently in the vector DB.
    """
    try:
        # Get all metadata (limit to a high number to catch everything)
        data = collection.get(include=["metadatas"])
        
        # Extract unique sources
        unique_files = set()
        for meta in data['metadatas']:
            if meta and 'source' in meta:
                unique_files.add(meta['source'])
        
        return list(unique_files)
    except Exception as e:
        print(f"Error listing files: {e}")
        return []

# --- NEW: DELETE FILE ---
def delete_file_from_memory(filename: str):
    """
    Removes all chunks associated with a specific filename.
    """
    try:
        print(f"[DELETE] Deleting {filename} from memory...")
        collection.delete(where={"source": filename})
        return True
    except Exception as e:
        print(f"Error deleting file: {e}")
        return False