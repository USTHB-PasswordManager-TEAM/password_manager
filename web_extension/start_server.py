"""
PASSWORD MANAGER - Startup Script
Run this script to start the backend server
"""

import subprocess
import sys
import os

def main():
    print("=" * 50)
    print("🔐 PASSWORD MANAGER - Web Extension")
    print("=" * 50)
    print()
    
    # Check if we're in the correct directory
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    
    if not os.path.exists(backend_dir):
        print("❌ Error: backend directory not found!")
        print("   Make sure you're running this from the web_extension folder")
        return
    
    # Install requirements
    print("📦 Installing dependencies...")
    requirements_file = os.path.join(backend_dir, "requirements.txt")
    
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", requirements_file, "-q"
        ], check=True)
        print("✅ Dependencies installed successfully!")
    except subprocess.CalledProcessError:
        print("⚠️  Warning: Some dependencies may not have installed correctly")
    
    print()
    print("🚀 Starting server...")
    print("=" * 50)
    print()
    print("📌 Server URL: http://localhost:5000")
    print("📌 API Health: http://localhost:5000/api/health")
    print()
    print("📝 To load the extension:")
    print("   Chrome: chrome://extensions → Load unpacked → Select 'extension' folder")
    print("   Firefox: about:debugging → Load Temporary Add-on → Select manifest.json")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    print()
    
    # Start the Flask app
    app_file = os.path.join(backend_dir, "app.py")
    
    try:
        subprocess.run([sys.executable, app_file])
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped. Goodbye!")

if __name__ == "__main__":
    main()


