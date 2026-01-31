"""
CyberXperience 2026 - Stage 1: Information Disclosure
Web Traversal Service - Vulnerable Flask Application
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# "Safe" web root directory
WEB_ROOT = "/app/public"

@app.route('/')
def index():
    return jsonify({
        "service": "Document Retrieval API",
        "version": "1.0.0",
        "endpoints": {
            "/api/files": "List available documents",
            "/api/files/<filename>": "Retrieve a specific document"
        }
    })

@app.route('/api/files')
def list_files():
    """List files in the public directory"""
    try:
        files = os.listdir(WEB_ROOT)
        return jsonify({
            "status": "success",
            "files": files
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/files/read')
def get_file_by_query():
    """
    VULNERABLE: This endpoint does not sanitize the filename parameter,
    allowing directory traversal attacks using ../ sequences.
    Uses query parameter to avoid path normalization issues.
    """
    filename = request.args.get('name', '')
    if not filename:
        return jsonify({
            "status": "error",
            "message": "Missing 'name' parameter"
        }), 400

    # Intentionally vulnerable - no path sanitization
    file_path = os.path.join(WEB_ROOT, filename)

    try:
        with open(file_path, 'r') as f:
            content = f.read()
        return jsonify({
            "status": "success",
            "filename": filename,
            "content": content
        })
    except FileNotFoundError:
        return jsonify({
            "status": "error",
            "message": f"File not found: {filename}"
        }), 404
    except PermissionError:
        return jsonify({
            "status": "error",
            "message": "Permission denied"
        }), 403
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/files/<path:filename>')
def get_file(filename):
    """
    VULNERABLE: This endpoint does not sanitize the filename parameter,
    allowing directory traversal attacks using ../ sequences.
    """
    # Intentionally vulnerable - no path sanitization
    file_path = os.path.join(WEB_ROOT, filename)

    try:
        with open(file_path, 'r') as f:
            content = f.read()
        return jsonify({
            "status": "success",
            "filename": filename,
            "content": content
        })
    except FileNotFoundError:
        return jsonify({
            "status": "error",
            "message": f"File not found: {filename}"
        }), 404
    except PermissionError:
        return jsonify({
            "status": "error",
            "message": "Permission denied"
        }), 403
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
