import os
from flask import Flask, render_template, send_file, abort, request
from pathlib import Path
import mimetypes

app = Flask(__name__)

# Configure the base directory for file browsing
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

def is_safe_path(path):
    """Check if the path is safe and within BASE_DIR"""
    try:
        requested_path = os.path.abspath(os.path.join(BASE_DIR, path))
        return requested_path.startswith(BASE_DIR)
    except:
        return False

@app.route('/')
def index():
    """Main page - browse files"""
    path = request.args.get('path', '')

    if not is_safe_path(path):
        abort(403)

    full_path = os.path.join(BASE_DIR, path)

    # If it's a file, serve it
    if os.path.isfile(full_path):
        return view_file(path)

    # If it's a directory, list contents
    if os.path.isdir(full_path):
        return list_directory(path)

    abort(404)

def list_directory(path):
    """List directory contents"""
    full_path = os.path.join(BASE_DIR, path)

    items = []
    try:
        for item in sorted(os.listdir(full_path)):
            # Skip hidden files and .git directory
            if item.startswith('.'):
                continue

            item_path = os.path.join(path, item)
            full_item_path = os.path.join(full_path, item)

            is_dir = os.path.isdir(full_item_path)
            size = os.path.getsize(full_item_path) if not is_dir else 0

            items.append({
                'name': item,
                'path': item_path,
                'is_dir': is_dir,
                'size': size
            })
    except Exception as e:
        abort(500)

    return render_template('index.html', items=items, current_path=path, is_listing=True)

def view_file(path):
    """View file contents"""
    full_path = os.path.join(BASE_DIR, path)

    # Get file info
    mime_type, _ = mimetypes.guess_type(full_path)
    file_size = os.path.getsize(full_path)

    # Check if file is too large (> 1MB)
    if file_size > 1024 * 1024:
        return render_template('index.html',
                             error="File is too large to display (> 1MB)",
                             file_path=path,
                             is_listing=False)

    # Try to read as text
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Determine language for syntax highlighting
        ext = os.path.splitext(path)[1].lower()
        language_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.xml': 'xml',
            '.md': 'markdown',
            '.sh': 'bash',
            '.txt': 'plaintext',
        }
        language = language_map.get(ext, 'plaintext')

        return render_template('index.html',
                             content=content,
                             file_path=path,
                             language=language,
                             file_size=file_size,
                             is_listing=False)
    except UnicodeDecodeError:
        # Binary file
        return render_template('index.html',
                             error="Binary file - cannot display as text",
                             file_path=path,
                             download_link=f"/download?path={path}",
                             is_listing=False)
    except Exception as e:
        abort(500)

@app.route('/download')
def download():
    """Download a file"""
    path = request.args.get('path', '')

    if not is_safe_path(path):
        abort(403)

    full_path = os.path.join(BASE_DIR, path)

    if not os.path.isfile(full_path):
        abort(404)

    return send_file(full_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
