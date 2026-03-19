import os

def generate_code_export():
    project_root = r"e:\Top Up\Final Project\Financial SLM\code"
    output_file = r"e:\Top Up\Final Project\Financial SLM\Financial_SLM_Full_Codebase.md"
    
    # Directories to ignore
    exclude_dirs = {
        'node_modules', '.git', '__pycache__', 'venv', '.venv', 'dist', 
        'build', '.pytest_cache', '.next', 'public', 'assets', 'chroma_db'
    }
    
    # File extensions to include
    include_exts = {
        '.py', '.jsx', '.js', '.tsx', '.ts', '.css', '.html', '.json', '.md', '.env', '.txt'
    }

    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write("# Financial SLM - Complete Codebase\n\n")
        
        for root, dirs, files in os.walk(project_root):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in include_exts:
                    # Skip lock files as they are huge and auto-generated
                    if file in ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']:
                        continue
                        
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, project_root)
                    
                    outfile.write(f"## File: `{rel_path}`\n\n")
                    
                    # Determine markdown syntax highlighting
                    lang = ext.lstrip('.')
                    if lang == 'jsx': lang = 'javascript'
                    if lang == 'tsx': lang = 'typescript'
                    if lang == 'py': lang = 'python'
                    if lang == 'env': lang = 'shell'
                    
                    outfile.write(f"```{lang}\n")
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"// Error reading file: {e}\n")
                        
                    outfile.write("\n```\n\n---\n\n")
                    
    print(f"✅ Code export successfully generated at: {output_file}")

if __name__ == "__main__":
    generate_code_export()
