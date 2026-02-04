"""
PASSWORD MANAGER - Flask API Server
A secure REST API for the browser extension
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import os

from database_manager import DatabaseManager
from auth_manager import AuthManager
from password_generator import PasswordGenerator

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["chrome-extension://*", "moz-extension://*", "http://localhost:*"])

# Initialize managers
db = DatabaseManager()
auth = AuthManager()
generator = PasswordGenerator()


# =====================================
# Authentication Middleware
# =====================================
def require_auth(f):
    """Decorator to require authentication for routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        result = auth.verify_token(token)
        if not result["valid"]:
            return jsonify({"error": result["error"]}), 401
        
        return f(*args, **kwargs)
    return decorated


# =====================================
# Auth Routes
# =====================================
@app.route("/api/auth/status", methods=["GET"])
def auth_status():
    """Check if master password is set."""
    return jsonify({
        "master_exists": auth.master_exists(),
        "message": "Ready" if auth.master_exists() else "Setup required"
    })


@app.route("/api/auth/setup", methods=["POST"])
def setup_master():
    """Set up master password (first time only)."""
    if auth.master_exists():
        return jsonify({"error": "Master password already set"}), 400
    
    data = request.get_json()
    password = data.get("password", "")
    
    result = auth.set_master_password(password)
    
    if "error" in result:
        return jsonify(result), 400
    
    # Auto-login after setup
    token = auth.generate_token()
    return jsonify({"message": result["message"], "token": token})


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Login with master password."""
    data = request.get_json()
    password = data.get("password", "")
    
    if auth.check_master_password(password):
        token = auth.generate_token()
        return jsonify({"message": "Login successful", "token": token})
    else:
        return jsonify({"error": "Invalid password"}), 401


@app.route("/api/auth/logout", methods=["POST"])
@require_auth
def logout():
    """Logout and invalidate token."""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    result = auth.invalidate_token(token)
    return jsonify(result)


@app.route("/api/auth/change-password", methods=["POST"])
@require_auth
def change_password():
    """Change master password."""
    data = request.get_json()
    old_password = data.get("old_password", "")
    new_password = data.get("new_password", "")
    
    result = auth.change_master_password(old_password, new_password)
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result)


@app.route("/api/auth/verify", methods=["GET"])
@require_auth
def verify_token():
    """Verify if current token is valid."""
    return jsonify({"valid": True, "message": "Token is valid"})


# =====================================
# Password Routes
# =====================================
@app.route("/api/passwords", methods=["GET"])
@require_auth
def get_passwords():
    """Get all passwords with optional filters."""
    search = request.args.get("search")
    category = request.args.get("category")
    favorites = request.args.get("favorites", "").lower() == "true"
    
    passwords = db.get_passwords(
        search=search,
        category=category,
        favorites_only=favorites
    )
    
    return jsonify({"passwords": passwords, "count": len(passwords)})


@app.route("/api/passwords/<int:password_id>", methods=["GET"])
@require_auth
def get_password(password_id):
    """Get a single password by ID."""
    password = db.get_password_by_id(password_id)
    
    if password:
        return jsonify(password)
    else:
        return jsonify({"error": "Password not found"}), 404


@app.route("/api/passwords", methods=["POST"])
@require_auth
def add_password():
    """Add a new password."""
    data = request.get_json()
    
    required_fields = ["website", "username", "password"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    result = db.add_password(
        website=data["website"],
        username=data["username"],
        password=data["password"],
        url=data.get("url", ""),
        category=data.get("category", "General"),
        notes=data.get("notes", "")
    )
    
    return jsonify(result), 201


@app.route("/api/passwords/<int:password_id>", methods=["PUT"])
@require_auth
def update_password(password_id):
    """Update an existing password."""
    data = request.get_json()
    
    result = db.update_password(
        password_id=password_id,
        website=data.get("website"),
        username=data.get("username"),
        password=data.get("password"),
        url=data.get("url"),
        category=data.get("category"),
        notes=data.get("notes"),
        favorite=data.get("favorite")
    )
    
    return jsonify(result)


@app.route("/api/passwords/<int:password_id>", methods=["DELETE"])
@require_auth
def delete_password(password_id):
    """Delete a password."""
    result = db.delete_password(password_id)
    return jsonify(result)


@app.route("/api/passwords/<int:password_id>/favorite", methods=["POST"])
@require_auth
def toggle_favorite(password_id):
    """Toggle favorite status."""
    result = db.toggle_favorite(password_id)
    return jsonify(result)


# =====================================
# Category Routes
# =====================================
@app.route("/api/categories", methods=["GET"])
@require_auth
def get_categories():
    """Get all categories."""
    categories = db.get_categories()
    return jsonify({"categories": categories})


@app.route("/api/categories", methods=["POST"])
@require_auth
def add_category():
    """Add a new category."""
    data = request.get_json()
    
    if not data.get("name"):
        return jsonify({"error": "Category name is required"}), 400
    
    result = db.add_category(
        name=data["name"],
        icon=data.get("icon", "📁"),
        color=data.get("color", "#7E57C2")
    )
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result), 201


# =====================================
# Password Generator Routes
# =====================================
@app.route("/api/generate", methods=["POST"])
@require_auth
def generate_password():
    """Generate a new password."""
    data = request.get_json() or {}
    
    password = generator.generate(
        length=data.get("length", 16),
        use_lowercase=data.get("lowercase", True),
        use_uppercase=data.get("uppercase", True),
        use_digits=data.get("digits", True),
        use_special=data.get("special", True),
        exclude_ambiguous=data.get("exclude_ambiguous", False)
    )
    
    strength = generator.check_strength(password)
    
    return jsonify({
        "password": password,
        "strength": strength
    })


@app.route("/api/generate/memorable", methods=["POST"])
@require_auth
def generate_memorable():
    """Generate a memorable passphrase."""
    data = request.get_json() or {}
    
    password = generator.generate_memorable(
        word_count=data.get("word_count", 4),
        separator=data.get("separator", "-"),
        capitalize=data.get("capitalize", True),
        add_number=data.get("add_number", True)
    )
    
    strength = generator.check_strength(password)
    
    return jsonify({
        "password": password,
        "strength": strength
    })


@app.route("/api/generate/pin", methods=["POST"])
@require_auth
def generate_pin():
    """Generate a PIN."""
    data = request.get_json() or {}
    pin = generator.generate_pin(length=data.get("length", 6))
    return jsonify({"pin": pin})


@app.route("/api/check-strength", methods=["POST"])
def check_strength():
    """Check password strength (no auth required)."""
    data = request.get_json()
    password = data.get("password", "")
    
    if not password:
        return jsonify({"error": "Password is required"}), 400
    
    result = generator.check_strength(password)
    return jsonify(result)


# =====================================
# Auto-Save Routes
# =====================================
@app.route("/api/passwords/autosave/detect", methods=["POST"])
@require_auth
def detect_and_save_password():
    """Auto-detect and save credentials from form submission."""
    data = request.get_json()
    
    # Extract data from form
    website = data.get("website", "")
    url = data.get("url", "")
    username = data.get("username", "")
    password = data.get("password", "")
    
    if not all([website, username, password]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if similar password already exists
    existing = db.find_similar_password(website, username)
    
    if existing:
        return jsonify({
            "duplicate": True,
            "message": f"Password for {website} already exists",
            "existing": existing
        }), 200
    
    # Auto-save the password
    result = db.add_password(
        website=website,
        username=username,
        password=password,
        url=url,
        category=data.get("category", "General"),
        notes=data.get("notes", f"Auto-saved from {website}"),
        auto_saved=True
    )
    
    return jsonify({
        "success": True,
        "message": f"Credentials saved for {website}",
        "password": result
    }), 201


@app.route("/api/passwords/autosave/check", methods=["POST"])
@require_auth
def check_autosave_status():
    """Check if auto-save is enabled and if duplicate exists."""
    data = request.get_json()
    website = data.get("website", "")
    username = data.get("username", "")
    
    if not website:
        return jsonify({"error": "Website is required"}), 400
    
    # Check for existing credentials
    existing = db.find_similar_password(website, username)
    
    return jsonify({
        "website": website,
        "username": username,
        "exists": existing is not None,
        "existing": existing
    })


# =====================================
# Export/Import Routes
# =====================================
@app.route("/api/export", methods=["GET"])
@require_auth
def export_passwords():
    """Export all passwords."""
    passwords = db.export_passwords()
    return jsonify({"passwords": passwords, "count": len(passwords)})


@app.route("/api/import", methods=["POST"])
@require_auth
def import_passwords():
    """Import passwords from backup."""
    data = request.get_json()
    passwords = data.get("passwords", [])
    
    if not passwords:
        return jsonify({"error": "No passwords to import"}), 400
    
    result = db.import_passwords(passwords)
    return jsonify(result)


# =====================================
# Statistics Route
# =====================================
@app.route("/api/stats", methods=["GET"])
@require_auth
def get_statistics():
    """Get password statistics."""
    stats = db.get_statistics()
    return jsonify(stats)


# =====================================
# Health Check
# =====================================
@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "version": "2.0.0"})


# =====================================
# Run Server
# =====================================
if __name__ == "__main__":
    print("🔒 PASSWORD MANAGER API Server")
    print("=" * 40)
    print("Starting server on http://localhost:5000")
    print("=" * 40)
    app.run(host="127.0.0.1", port=5000, debug=True)


