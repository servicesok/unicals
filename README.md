# Unicals - File Viewer

A simple and secure web-based file viewer built with Flask. Browse directories and view file contents with syntax highlighting.

## Features

- 📁 Browse directories in a clean, intuitive interface
- 📄 View text files with syntax highlighting
- 🔒 Secure path validation to prevent directory traversal
- ⬇️ Download binary files
- 🎨 Modern, responsive design
- 🌈 Syntax highlighting for multiple file types (Python, JavaScript, HTML, CSS, JSON, Markdown, etc.)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd unicals
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the application:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Browse your files and click on any file to view its contents

## Security

- The application only allows browsing files within the project directory
- Path validation prevents directory traversal attacks
- Hidden files and `.git` directory are not displayed
- Files larger than 1MB are not displayed (can be downloaded)

## Technologies

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Syntax Highlighting**: Highlight.js

## License

MIT License