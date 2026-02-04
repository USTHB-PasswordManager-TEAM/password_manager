# 🚀 PASSWORD MANAGER - Complete Setup Guide

## ⚡ Quick Setup (2 Minutes)

### Windows Users:
```powershell
# 1. Double-click this file:
web_extension/start.bat

# 2. Load extension in Chrome:
# - Open chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select: web_extension/extension folder

# 3. Click PASSWORD MANAGER icon → Create master password
# Done! 🎉
```

### Mac/Linux Users:
```bash
# 1. Start backend:
cd web_extension/backend
pip install -r requirements.txt
python app.py

# 2. Load extension in browser
# 3. Create master password
# Done! 🎉
```

## 📋 Detailed Setup Instructions

### Step 1: Prerequisites

**Required:**
- Python 3.7 or higher ([Download](https://python.org))
- Chrome, Firefox, or Edge browser
- Windows, Mac, or Linux OS

**Check Python:**
```bash
python --version
# Should show: Python 3.7+ or higher
```

### Step 2: Install Backend

**Windows:**
```powershell
cd web_extension
start.bat
```

**Mac/Linux:**
```bash
cd web_extension/backend
pip install -r requirements.txt
python app.py
```

**You should see:**
```
🔒 PASSWORD MANAGER API Server
========================================
Starting server on http://localhost:5000
========================================
 * Running on http://127.0.0.1:5000
```

**Keep this terminal open!**

### Step 3: Install Browser Extension

#### Chrome/Edge:
1. Open browser
2. Navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Toggle "Developer mode" ON (top-right)
4. Click "Load unpacked"
5. Navigate to `web_extension/extension` folder
6. Click "Select Folder"
7. ✅ PASSWORD MANAGER icon appears in toolbar!

#### Firefox:
1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to `web_extension/extension` folder
5. Select `manifest.json`
6. ✅ PASSWORD MANAGER icon appears in toolbar!

### Step 4: First-Time Setup

1. Click PASSWORD MANAGER icon (🔐) in toolbar
2. You'll see "Create Master Password" screen
3. Create a strong password:
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Example: `MyDog-Fluffy-2024!`
4. Confirm password
5. Click "Create Password"
6. ✅ You're in!

**IMPORTANT:** Remember this password! No recovery possible!

## ✨ First Use Tutorial

### Save Your First Password

1. Visit any website (e.g., `github.com`)
2. Click "Sign up" or "Login"
3. Fill in credentials
4. Click "Sign in"
5. PASSWORD MANAGER notification appears: "💾 Save Password?"
6. Click "✓ Save"
7. ✅ Password saved!

### Use Auto-Fill

1. Visit same website again
2. See PASSWORD MANAGER icon (🔐) in password field
3. Click it OR press `Ctrl+Shift+L`
4. Select your account
5. ✅ Auto-filled!

### Generate Strong Password

1. Open PASSWORD MANAGER popup
2. Click "🎲 Generate"
3. Adjust settings if needed
4. Click "📋 Copy"
5. Use in signup forms
6. ✅ Strong password created!

## 🔧 Configuration

### Auto-Save Settings
```javascript
// Enable/disable auto-save
Settings → Auto-save → Toggle ON/OFF

// Notification duration
Settings → Auto-save timeout → 15 seconds
```

### Security Settings
```javascript
// Auto-lock timeout
Settings → Security → Auto-lock: 5 minutes

// Theme
Click 🌙 icon → Toggle dark/light
```

### Keyboard Shortcuts
```
Ctrl+Shift+L - Open auto-fill
Esc - Close popup
```

## 🛠️ Advanced Setup

### Custom Port
```python
# Edit backend/app.py line 366:
app.run(host="127.0.0.1", port=5000)  # Change 5000 to your port
```

### Database Location
```python
# Edit backend/database_manager.py line 15:
def __init__(self, db_file: str = "passwords.db")  # Change path
```

### Extension Customization
```javascript
// Edit extension/popup/popup.css for colors
// Edit extension/manifest.json for permissions
```

## 🐛 Troubleshooting

### Problem: "Can't connect to server"

**Solution:**
```bash
# Check if server is running:
# You should see terminal with:
# "Running on http://127.0.0.1:5000"

# If not, start it:
cd web_extension/backend
python app.py
```

### Problem: "Extension not loading"

**Solution:**
```
1. Check Developer mode is ON
2. Reload extension
3. Check browser console (F12) for errors
4. Verify manifest.json exists
```

### Problem: "Auto-save not working"

**Solution:**
```
1. ✓ Backend server running?
2. ✓ Logged into PASSWORD MANAGER?
3. ✓ Notifications enabled in browser?
4. ✓ Did you submit the form?
5. ✓ Check extension permissions
```

### Problem: "PASSWORD MANAGER icon not showing"

**Solution:**
```
1. Refresh webpage (F5)
2. Check if login form exists
3. Reload extension
4. Check content script loaded (F12 → Console)
```

### Problem: "Forgot master password"

**Unfortunately:**
- No recovery possible (zero-knowledge design)
- This is intentional for security
- You must reset:
  1. Delete `backend/passwords.db`
  2. Delete `backend/*.key`
  3. Restart PASSWORD MANAGER
  4. Create new master password
- **Prevention:** Always remember your password!

## 📦 File Structure

```
web_extension/
├── backend/               # Python API server
│   ├── app.py            # Main server
│   ├── database_manager.py
│   ├── auth_manager.py
│   ├── password_generator.py
│   ├── requirements.txt  # Dependencies
│   ├── passwords.db      # Database (created on first run)
│   └── *.key             # Encryption keys (auto-generated)
│
├── extension/            # Browser extension
│   ├── manifest.json     # Extension config
│   ├── popup/            # Main UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── content/          # Auto-save/fill
│   │   └── content.js
│   ├── background/       # Service worker
│   │   └── background.js
│   ├── utils/            # Utilities
│   │   └── settings.js
│   └── icons/            # Extension icons
│
├── start.bat             # Windows startup script
├── start_server.py       # Python startup script
├── README.md             # Main documentation
├── USER_GUIDE.md         # Complete manual
├── QUICK_REFERENCE.md    # Cheat sheet
├── PREMIUM_FEATURES.md   # Feature list
└── SETUP_GUIDE.md        # This file
```

## 🔒 Security Notes

### What is Encrypted:
✅ All passwords (AES-256)
✅ Usernames
✅ URLs
✅ Notes

### What is NOT Encrypted:
❌ Website names (needed for search)
❌ Categories (needed for filtering)
❌ Master password hash (bcrypt, one-way)

### Security Best Practices:
1. Use strong master password
2. Enable auto-lock
3. Backup regularly
4. Don't share master password
5. Close PASSWORD MANAGER when done
6. Use HTTPS websites only
7. Keep software updated

## 💾 Backup & Restore

### Backup Process:
```
1. Open PASSWORD MANAGER
2. Click Settings (⚙️)
3. Click "Export Passwords"
4. Save JSON file
5. Store securely (encrypted folder)
```

### Restore Process:
```
1. Open PASSWORD MANAGER
2. Click Settings (⚙️)
3. Click "Import Passwords"
4. Select backup JSON file
5. Passwords restored ✓
```

### Backup Schedule:
- Weekly for active users
- Monthly for casual users
- Before major updates
- Before system changes

## 🎯 Next Steps

After setup:
1. ✅ Save first password
2. ✅ Test auto-fill
3. ✅ Generate strong password
4. ✅ Organize with categories
5. ✅ Create backup
6. ✅ Share with friends!

## 📚 Additional Resources

- [README.md](README.md) - Overview and features
- [USER_GUIDE.md](USER_GUIDE.md) - Complete usage guide
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick tips
- [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md) - All features

## 💬 Support

Need help?
1. Check [USER_GUIDE.md](USER_GUIDE.md)
2. Check troubleshooting section above
3. Review [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
4. Check browser console (F12) for errors

## 🎉 You're Ready!

Start using PASSWORD MANAGER:
```bash
# 1. Server running? ✓
# 2. Extension loaded? ✓
# 3. Master password set? ✓
# 4. Ready to save passwords! 🎉
```

**Welcome to the best password manager ever!** 🔐✨

---

**PASSWORD MANAGER** - Your passwords, automatically secured!

Made with ❤️ for security and privacy.


