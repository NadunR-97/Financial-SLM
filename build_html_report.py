import os
import base64

def get_base64_image(image_path):
    try:
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            ext = os.path.splitext(image_path)[1].lower()
            mime_type = "image/png"
            if ext == ".webp": mime_type = "image/webp"
            elif ext in [".jpeg", ".jpg"]: mime_type = "image/jpeg"
            return f"data:{mime_type};base64,{encoded_string}"
    except Exception as e:
        print(f"Error loading {image_path}: {e}")
        return ""

def read_file_content(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {e}"

def generate_report():
    output_file = r"e:\Top Up\Final Project\Financial SLM\Final_Implementation_Report.html"
    project_root = r"e:\Top Up\Final Project\Financial SLM"
    code_dir = os.path.join(project_root, "code")
    artifact_dir = r"C:\Users\Nadun Rathnayake\.gemini\antigravity\brain\d3abb3a2-4a28-43df-8287-cb27a67317b5"

    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Financial SLM - Comprehensive Implementation Report</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 40px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            h2 { color: #2980b9; margin-top: 40px; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; page-break-before: always; }
            h3 { color: #16a085; }
            pre { background-color: #f8f9fa; border: 1px solid #e9ecef; border-left: 4px solid #3498db; padding: 15px; overflow-x: auto; border-radius: 4px; font-family: Consolas, monospace; font-size: 11px; white-space: pre-wrap; word-wrap: break-word;}
            code { font-family: Consolas, monospace; }
            img { max-width: 100%; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin: 20px 0; }
            .explanation { background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .section { margin-bottom: 60px; }
        </style>
    </head>
    <body>
        <h1>Comprehensive System Implementation Report</h1>
        <p>This document contains the complete codebase, architectural explanations, and visual evidence of the Enterprise Financial Data Agent platform.</p>
    """

    # --- Section: Authentication ---
    html_content += """
    <div class="section">
        <h2>1. Authentication & Role-Based Access Control (RBAC)</h2>
        <div class="explanation">
            <strong>What this module achieves:</strong> This module enforces strict security. It receives login requests, validates hashed passwords using <code>bcrypt</code>, and generates encrypted JSON Web Tokens (JWT) containing the user's explicit role. The backend acts as a middleware gatekeeper, instantly blocking any unauthorized API requests.
        </div>
        <h3>Visual Outcome:</h3>
        <p>Dynamic navigation panels render depending on JWT role validation.</p>
        <img src=\"""" + get_base64_image(os.path.join(artifact_dir, "test_admin_login_1773207775340.webp")) + """\" alt="Admin Verification UI">
    </div>
    """

    # --- Section: Anomaly Detection ---
    html_content += """
    <div class="section">
        <h2>2. Big Data Integrity & Anomaly Detection</h2>
        <div class="explanation">
            <strong>What this module achieves:</strong> This engine ensures data reliability by calculating standard deviation variances. Using <code>pandas</code>, it groups transactions by product and calculates the Z-Score for every revenue data point. Anything deviating beyond 2.0 standard deviations is mathematically flagged as a critical anomaly and sent to the frontend for urgent review.
        </div>
        <h3>Visual Outcome:</h3>
        <p>The system actively highlights extreme revenue spikes/drops using warning indicators.</p>
        <img src=\"""" + get_base64_image(os.path.join(artifact_dir, "verify_anomalies_1773234303092.webp")) + """\" alt="Z-Score Anomaly Dashboard">
    </div>
    """

    # --- Section: Sentiment Analysis ---
    html_content += """
    <div class="section">
        <h2>3. NLP Sentiment Extraction</h2>
        <div class="explanation">
            <strong>What this module achieves:</strong> This endpoint bridges unstructured qualitative data with strictly formatted APIs. It injects analyst notes into a hardened LangChain system prompt. The model deterministically extracts sentiment polarity, computes a float score, and isolates 3 key behavioral risks into a JSON payload parsed by the React UI.
        </div>
        <h3>Visual Outcome:</h3>
        <p>A specialized workspace extracts behavioral risk intelligence instantly.</p>
        <img src=\"""" + get_base64_image(os.path.join(artifact_dir, "sentiment_analysis_result_1773236519443.png")) + """\" alt="Sentiment Analytics Report">
    </div>
    """

    # --- Section: Predictive Analytics ---
    html_content += """
    <div class="section">
        <h2>4. Predictive Machine Learning & Academic Validation</h2>
        <div class="explanation">
            <strong>What this module achieves:</strong> This is the core quantitative backbone of the project. It imports <code>scikit-learn</code> to perform a formal Machine Learning algorithmic pipeline. 
            <br>1. It splits the dataset into 80% training / 20% testing data.
            <br>2. It trains a <code>LinearRegression</code> predictive model.
            <br>3. It mathematically validates the model's accuracy against the hidden 20% chunk by computing the Root Mean Squared Error (RMSE), Mean Absolute Error (MAE), and R-Squared (R²) metrics.
            <br>4. It generates a Pandas Feature Importance Correlation matrix.
        </div>
        <h3>Visual Outcome:</h3>
        <p>The academic pipeline scores are proven via real-time rendering on the Recharts AreaChart.</p>
        <img src=\"""" + get_base64_image(os.path.join(artifact_dir, "product_analytics_bottom_view_1773283573776.png")) + """\" alt="Scikit-Learn Verification Cards">
    </div>
    """

    # --- Section: Full Codebase with Explanations ---
    html_content += """
    <div class="section">
        <h2>5. Complete System Source Code & Architecture Breakdown</h2>
        <p>The following section contains the full source code for the Financial SLM React + FastAPI implementation. <strong>Each file is accompanied by a detailed explanation of its architectural purpose and exact mechanical function.</strong></p>
    """
    
    # Define educational descriptions for the codebase
    file_descriptions = {
        "main.py": "<strong>The Core API Router & Auth Controller:</strong> This file initializes the FastAPI application. It defines all the REST API endpoints, handles the JWT role-based security gateway, and controls the flow of data coming from the React frontend to the specialized ML/NLP engines.",
        "models.py": "<strong>Database ORM Schema:</strong> Defines the SQLAlchemy Object-Relational Mapping (ORM) classes. This file translates Python objects (like the 'User' class) into physical SQLite/PostgreSQL database tables and columns.",
        "database.py": "<strong>Database Connection Manager:</strong> Handles the physical connection protocol to the relational database. It establishes the connection engine and provides the session state so that the backend can asynchronously write and read data cleanly.",
        "config.py": "<strong>Environment & Secret Configuration:</strong> Securely loads the `.env` variables required to run the application, including the JWT encryption secrets and the Google Gemini API keys.",
        "sales.py": "<strong>The Machine Learning & Big Data Engine:</strong> The Quantitative backend. It uses `pandas` to calculate Z-Score anomalies on massive datasets, and runs `scikit-learn` Linear Regression mathematical algorithms to predict future revenue and evaluate academic metrics (MAE/RMSE).",
        "rag.py": "<strong>Retrieval-Augmented Generation Agent:</strong> Houses the LangChain initialization code. This connects the application to the massive Google Gemini LLM, allowing it to autonomously read tabular datasets and chat with the user natively.",
        "ocr.py": "<strong>Optical Character Recognition Pipeline:</strong> A specialized unstructured data ingestion pipeline. It allows the backend to take raw image bytes (e.g. scanned KYC PDFs) and extract the physical text for the generative AI to summarize.",
        "App.jsx": "<strong>React Router Configuration:</strong> The top-level frontend map. It defines exactly which URLs map to which components, ensuring that unauthenticated users cannot access protected `/dashboard` routes.",
        "DashboardLayout.jsx": "<strong>The Enterprise UI Shell & RBAC Viewer:</strong> Maps out the standard sidebar and top navigation for the platform. It dynamically reads the user's role from their JWT token to hide or show specific capabilities (like restricting 'Credit Appraisal' to Managers only).",
        "Login.jsx": "<strong>Authentication Interface:</strong> The landing page. It securely captures the user's username/password, hashes it, posts it to the FastAPI backend, and safely stores the returned JWT token into browser LocalStorage.",
        "Chat.jsx": "<strong>Conversational BI Interface:</strong> The UI allowing users to have an open-ended natural language conversation with the underlying database, powered by the RAG backend component.",
        "ProductAnalytics.jsx": "<strong>Advanced Quantitative Dashboard:</strong> The main visual powerhouse. It ingests the JSON payload from the Machine Learning backend and renders it into interactive `Recharts` graphs, dynamic Heatmap Correlation tables, and flashing Red Anomaly alerts.",
        "CreditAppraisal.jsx": "<strong>KYC Risk Assessment Tool:</strong> A highly specialized multi-step form and dashboard meant to automatically score a corporate client based on OCR scanned documents and quantitative financials.",
        "SentimentAnalysis.jsx": "<strong>Qualitative NLP Extraction UI:</strong> The workspace where analysts paste unstructured text (like emails or interview notes) so the backend can run determinist JSON classification to extract extreme behavioral risks."
    }

    exclude_dirs = {
        'node_modules', '.git', '__pycache__', 'venv', '.venv', 'dist', 
        'build', '.pytest_cache', '.next', 'public', 'assets', 'chroma_db'
    }
    include_exts = {
        '.py', '.jsx', '.js', '.tsx', '.ts', '.css', '.html', '.json', '.env'
    }

    for root, dirs, files in os.walk(code_dir):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in include_exts and file not in ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, code_dir)
                content = read_file_content(file_path).replace('<', '&lt;').replace('>', '&gt;')
                
                # Fetch descriptive text if it exists
                desc = file_descriptions.get(file, "<strong>Utility / Configuration File:</strong> A supporting file necessary to define styling, dependencies, or basic functional constants for the surrounding application architecture.")
                
                html_content += f"""
                <div style="margin-top: 50px;">
                    <h3>File: <code>{rel_path}</code></h3>
                    <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 12px; border-radius: 6px; margin-bottom: 10px; font-size: 14px;">
                        {desc}
                    </div>
                    <pre><code>{content}</code></pre>
                </div>
                """

    html_content += """
    </div>
    </body>
    </html>
    """

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"✅ Full HTML Report Generated with Code Explanations at: {output_file}")

if __name__ == "__main__":
    generate_report()
