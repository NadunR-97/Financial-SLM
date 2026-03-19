import os

def read_file_content(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().replace('<', '&lt;').replace('>', '&gt;')
    except Exception as e:
        return f"Error reading file {file_path}: {e}"

def generate_full_implementation_report():
    output_file = r"e:\Top Up\Final Project\Financial SLM\Financial_SLM_Full_Implementation_Report.html"
    project_root = r"e:\Top Up\Final Project\Financial SLM"
    
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Financial SLM - Full System Implementation Report</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 40px; background-color: #fcfcfc;}
            h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 15px; margin-bottom: 30px; margin-top: 50px; }
            h1:first-child { margin-top: 0; }
            h2 { color: #2980b9; margin-top: 40px; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; font-size: 28px; }
            h3 { color: #16a085; margin-top: 30px; font-size: 20px;}
            p { font-size: 16px; margin-bottom: 15px; }
            ul { font-size: 16px; margin-bottom: 20px; }
            li { margin-bottom: 8px; }
            
            /* Code snippet styling */
            pre { background-color: #f8f9fa; border: 1px solid #e9ecef; border-left: 5px solid #3498db; padding: 20px; overflow-x: auto; border-radius: 6px; font-family: 'Consolas', monospace; font-size: 13px; white-space: pre-wrap; word-wrap: break-word; box-shadow: 0 2px 4px rgba(0,0,0,0.05); max-height: 500px; overflow-y: auto;}
            code { font-family: 'Consolas', monospace; color: #b71c1c; font-size: 15px; }
            
            .explanation { background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #17a2b8; box-shadow: 0 4px 6px rgba(0,0,0,0.05);}
            .tech-stack { display: inline-block; background-color: #e9ecef; color: #495057; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-right: 5px; margin-bottom: 10px;}
        </style>
    </head>
    <body>
        <div style="text-align: center; margin-bottom: 60px;">
            <h1 style="border: none; font-size: 42px; color: #2c3e50; margin-bottom: 10px;">Enterprise Financial Data Agent</h1>
            <h2 style="border: none; color: #7f8c8d; margin-top: 0px;">Full Exhaustive Implementation Report: Ground-Up Architecture</h2>
            <p style="font-size: 18px; color: #7f8c8d; max-width: 800px; margin: 20px auto;">This comprehensive document details every single architectural component of the Financial SLM system, built from the ground up. It covers the database initialization, the FastAPI Python backend logic, the Machine Learning engines (Scikit-Learn/Pandas), the Generative AI integrations (LangChain/Gemini), and the modern React.js frontend.</p>
        </div>

        <h1>STAGE 1: BACKEND FOUNDATION & DATA PERSISTENCE</h1>
        <p>The system was built starting with a robust, persistent data layer. The backend relies on FastAPI for high-performance API routing, and SQLAlchemy for Object-Relational Mapping (ORM) to a local SQLite database.</p>
        """

    components = [
        {
            "title": "1.1. Database Connection Engine (database.py)",
            "tech": "Python, SQLAlchemy, SQLite",
            "desc": "This module establishes the physical connection to the `financial_slm.db` SQLite database. It initializes the `create_engine` mechanism, allowing the FastAPI application to pool and manage asynchronous HTTP threads concurrently without locking the database file.",
            "file": r"code\backend\app\database.py"
        },
        {
            "title": "1.2. Database ORM Schema (models.py)",
            "tech": "Python, SQLAlchemy ORM",
            "desc": "Object-Relational Mapping (ORM) allows us to write Python classes that automatically translate into physical SQL tables. This file defines the explicit schema for our `User` table (storing hashed passwords and roles) and our `ClientRisk` table.",
            "file": r"code\backend\app\models.py"
        },
        {
            "title": "1.3. Base API Router & Security Handlers (main.py - Auth)",
            "tech": "FastAPI, Passlib (bcrypt), JWT",
            "desc": "This is the core entry point of the backend system. It handles Cross-Origin Resource Sharing (CORS) so the React frontend can talk to it. Crucially, it implements the OAuth2 Login system. Passwords are cryptographically hashed using `bcrypt`, and authenticated users are issued a JSON Web Token (JWT) containing their specific Role (Admin vs. Analyst).",
            "file": r"code\backend\app\main.py"
        }
    ]

    for comp in components:
        html += f"""
        <h2>{comp["title"]}</h2>
        <div class="tech-stack">{comp["tech"]}</div>
        <div class="explanation">
            <strong>Implementation Details:</strong> {comp["desc"]}
        </div>
        <pre><code>{read_file_content(os.path.join(project_root, comp["file"]))}</code></pre>
        """

    html += """
        <h1>STAGE 2: ANALYTICAL ENGINES & MACHINE LEARNING</h1>
        <p>Once the foundation was laid, we built the Quantitative and Qualitative analytical engines. These scripts do the heavy mathematical lifting for the enterprise dashboard.</p>
    """

    components_ml = [
        {
            "title": "2.1. Statistical Anomaly & ML Forecasting Engine (sales.py)",
            "tech": "Pandas, Scikit-Learn (LinearRegression)",
            "desc": "This is the most mathematically rigorous portion of the system. First, it uses `pandas` to group 5,000+ historical financial records by product. It calculates the Standard Deviation/Mean and extracts a Z-Score. Any variance > 2.0 is mathematically flagged as a severe anomaly. Secondly, it implements an 80/20 train/test split on `LinearRegression` temporal data to predict 2025 revenues, outputting the MAE/RMSE calculation proofs.",
            "file": r"code\backend\app\analytics\sales.py"
        },
        {
            "title": "2.2. Deterministic NLP Sentiment Extraction (main.py - Gemini Endpoint)",
            "tech": "Google Gemini Pro, Prompt Engineering",
            "desc": "This block forces the Google Gemini Large Language model to act as a highly strict JSON-output engine. Instead of conversational text, it takes in unstructured analyst risk notes and extracts an exact semantic Sentiment score (-1.0 to 1.0) and precisely 3 discrete bullet points of risk criteria.",
            "file": r"code\backend\app\main.py"
        },
        {
            "title": "2.3. Retrieval-Augmented Generation (RAG) Chatbot (rag.py)",
            "tech": "LangChain, ChromaDB, Gemini",
            "desc": "This module implements the RAG pipeline. It vectorizes the entire `fraud_test_data.csv` dataset, storing it dynamically into a Chroma vector database. When a user asks a question via the chat UI, LangChain performs semantic search across the dataset and injects the context directly into the LLM context limits.",
            "file": r"code\backend\app\analytics\rag.py"
        },
        {
            "title": "2.4. Multimodal Optical Character Recognition (ocr.py)",
            "tech": "Google Gemini Vision, Base64",
            "desc": "This pipeline evaluates physical static documents. A frontend user uploads an image/PDF (e.g., a corporate client's balance sheet). The file is converted to Base64, piped to the Vision API, and the unstructured text is translated into a highly structured Corporate Risk Assessment JSON.",
            "file": r"code\backend\app\analytics\ocr.py"
        }
    ]

    for comp in components_ml:
        html += f"""
        <h2>{comp["title"]}</h2>
        <div class="tech-stack">{comp["tech"]}</div>
        <div class="explanation">
            <strong>Implementation Details:</strong> {comp["desc"]}
        </div>
        <pre><code>{read_file_content(os.path.join(project_root, comp["file"]))}</code></pre>
        """

    html += """
        <h1>STAGE 3: REACT FRONTEND ARCHITECTURE</h1>
        <p>The user-facing layer was built using React (Vite). It consumes the FastAPI endpoints and provides a modern, responsive, and secure experience for the bank's analysts.</p>
    """

    components_ui = [
        {
            "title": "3.1. Route Map & Client-Side Security (App.jsx)",
            "tech": "React Router DOM",
            "desc": "This is the master React configuration. It defines the URL structures. It implements a `ProtectedRoute` wrapper component that aggressively checks `localStorage` for a valid JWT before allowing a user to render the internal Dashboard routes.",
            "file": r"code\frontend\src\App.jsx"
        },
        {
            "title": "3.2. Secure Authentication Portal (Login.jsx)",
            "tech": "React, Async Fetch, LocalStorage",
            "desc": "The visual component where administrators/analysts enter their credentials. It sends an OAuth2 `URLSearchParams` payload to FastAPI. Upon a HTTP 200 success, it safely stores the authentication token and the user's explicit structural Role into the browser's context.",
            "file": r"code\frontend\src\pages\Login.jsx"
        },
        {
            "title": "3.3. Enterprise Dashboard Shell (DashboardLayout.jsx)",
            "tech": "Lucide Icons, Tailwind-like CSS",
            "desc": "The sidebar master container. This component wraps every internal page. Crucially, it dynamically reads the user's role from their token. If the user is a standard Analyst, the Sidebar explicitly hides the 'Credit Appraisal' navigation link, enforcing visual RBAC security.",
            "file": r"code\frontend\src\components\DashboardLayout.jsx"
        },
        {
            "title": "3.4. Quantitative Analytics Dashboard (ProductAnalytics.jsx)",
            "tech": "Recharts (Visualizations), Axios (API)",
            "desc": "The largest visual component. It mounts and makes asynchronous calls to the backend's `sales.py` engine. It dynamically renders the Z-Score Anomalies as flashing red alert cards, plots the Scikit-Learn future forecast overlays natively on the time-series charts, and displays the Pandas mathematical Heatmap.",
            "file": r"code\frontend\src\pages\ProductAnalytics.jsx"
        },
        {
            "title": "3.5. Qualitative Sentiment Risk Engine (SentimentAnalysis.jsx)",
            "tech": "React State Management",
            "desc": "Provides a clean workspace for human analysts to paste unstructured text. When submitted, the React state maps the backend JSON generation. If the backend returns a 'Negative' sentiment class, the UI dynamically changes CSS classes to render Red cautionary interfaces to warn the user.",
            "file": r"code\frontend\src\pages\SentimentAnalysis.jsx"
        },
        {
            "title": "3.6. Context-Aware Generative Chat (Chat.jsx)",
            "tech": "React Hooks (useState, map)",
            "desc": "The interactive messaging portal. Maintains an array of message objects. When the user types a query, it displays immediately as a 'User' bubble, hits the LangChain/RAG backend endpoint, and returns the response dynamically rendered as an 'AI Agent' bubble with animated typing states.",
            "file": r"code\frontend\src\pages\Chat.jsx"
        },
        {
            "title": "3.7. KYC OCR Document Ingestion (CreditAppraisal.jsx)",
            "tech": "HTML5 File API, FileReader Base64",
            "desc": "A specialized tool for processing scanned documents. It enables drag-and-drop file ingestion, reads the physical byte array via the HTML5 File API, converts it into Base64 strings, and pipes it securely to the FastAPI Vision endpoint for automatic risk generation.",
            "file": r"code\frontend\src\pages\CreditAppraisal.jsx"
        }
    ]

    for comp in components_ui:
        html += f"""
        <h2>{comp["title"]}</h2>
        <div class="tech-stack">{comp["tech"]}</div>
        <div class="explanation">
            <strong>Implementation Details:</strong> {comp["desc"]}
        </div>
        <pre><code>{read_file_content(os.path.join(project_root, comp["file"]))}</code></pre>
        """

    html += """
        <div style="margin-top: 60px; text-align: center; color: #7f8c8d; font-size: 14px; border-top: 1px solid #ecf0f1; padding-top: 20px;">
            End of Exhaustive Ground-Up Implementation Report. Generated by Enterprise Financial Data Agent System.
        </div>
    </body>
    </html>
    """

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
        
    print(f"✅ Full Exhaustive Implementation HTML Report successfully generated: {output_file}")

if __name__ == "__main__":
    generate_full_implementation_report()
