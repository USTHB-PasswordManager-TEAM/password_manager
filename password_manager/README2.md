# PASSWORD MANAGER - Web Extension 🔐

**The Best Free Password Manager Ever Built** - Auto-save, Auto-fill, and Military-grade Security!

## 🌟 Features

### ✨ Core Features
- 🔄 **Auto-Save Credentials** - Automatically captures and saves passwords when you login
- 🔑 **Smart Auto-Fill** - One-click credential filling with Ctrl+Shift+L shortcut
- 🔐 **AES-256 Encryption** - Military-grade encryption for all passwords
- 🎲 **Password Generator** - Create strong, customizable passwords instantly
- 📁 **Smart Categories** - Auto-categorize passwords (Social, Banking, Shopping, etc.)
- 🔍 **Instant Search** - Find any password in milliseconds
- ⭐ **Favorites** - Quick access to your most-used passwords
- 🌙 **Dark/Light Mode** - Beautiful themes for any preference
- 💾 **Export/Import** - Backup and restore your password vault
- 🎯 **Duplicate Detection** - Prevents saving the same password twice

### 🛡️ Security Features
- **Zero-Knowledge Architecture** - Your data never leaves your device unencrypted
- **Master Password Protection** - bcrypt hashing with salt
- **Auto-Lock** - Locks after 5 minutes of inactivity
- **Session Management** - Secure JWT-based authentication
- **No Cloud Required** - 100% local-first approach
- **Open Source** - Fully auditable code

### 🎨 User Experience
- **Modern UI** - Clean, intuitive interface
- **Visual Indicators** - PASSWORD MANAGER icon appears on login forms
- **Toast Notifications** - Helpful feedback messages
- **Context Menu** - Right-click auto-fill option
- **Keyboard Shortcuts** - Power-user features
- **Responsive Design** - Works perfectly in any browser

## 🚀 Getting Started

### 1. Start the Backend Server

```bash
# Navigate to backend folder
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

The server will run on `http://localhost:5000`

**Quick Start (Windows):**
```bash
cd web_extension
start.bat
```

### 2. Load the Extension

**Chrome/Edge:**
1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `extension` folder

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` from the `extension` folder

### 3. Setup Master Password

1. Click the PASSWORD MANAGER extension icon
2. Create a strong master password
3. You're ready to go!

## 📖 How to Use

### Auto-Save Passwords
1. Visit any website and login normally
2. PASSWORD MANAGER automatically detects the login form
3. After submitting, you'll get a notification to save
4. Click "Save" and done! ✅

### Auto-Fill Passwords
1. Visit a website where you have saved credentials
2. Click the PASSWORD MANAGER icon (🔐) next to the password field
3. Or use keyboard shortcut: `Ctrl+Shift+L`
4. Select the account and credentials are filled automatically

### Generate Strong Passwords
1. Open PASSWORD MANAGER popup
2. Click "🎲 Generate"
3. Customize length and character types
4. Copy or use directly

## 🏗️ Architecture

```
web_extension/
├── backend/                 # Python Flask API Server
│   ├── app.py              # Main Flask application
│   ├── database_manager.py # Database operations + Auto-save
│   ├── auth_manager.py     # Authentication
│   ├── password_generator.py # Password generation
│   └── requirements.txt    # Python dependencies
│
├── extension/              # Browser Extension (Chrome/Firefox)
│   ├── manifest.json       # Extension manifest
│   ├── popup/              # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── background/         # Background scripts
│   │   └── background.js   # Auto-save handler
│   ├── content/            # Content scripts
│   │   └── content.js      # Form detection & auto-fill
│   └── icons/              # Extension icons
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
└── README.md               # This file
```

## ✨ Features

- 🔐 Secure password storage with Fernet encryption
- 🔑 Master password protection with bcrypt hashing
- 🎲 Built-in password generator
- 🔍 Search functionality
- 📋 One-click copy to clipboard
- 🌙 Dark/Light theme support
- 🔒 Auto-lock on inactivity
- 📊 Password strength indicator
- 🏷️ Password categories
- 💾 Export/Import functionality

## 🔒 Security

## 🔒 Security

- **AES-256 Encryption** - All passwords encrypted with Fernet (AES-256 symmetric encryption)
- **bcrypt Hashing** - Master password hashed with bcrypt + salt (industry standard)
- **Zero-Knowledge** - Server never sees your master password or unencrypted data
- **Local-First** - All data stored locally on your machine
- **Auto-Lock** - Automatically locks after 5 minutes of inactivity
- **CORS Protection** - Restricts API access to extension only
- **Session Tokens** - JWT-based secure session management
- **No Analytics** - No tracking, no telemetry, complete privacy

## 🎯 Why PASSWORD MANAGER is the Best

1. **100% Free** - No subscriptions, no premium tiers, completely free forever
2. **Open Source** - Fully auditable code for maximum trust
3. **Auto-Save** - Never manually save a password again
4. **Local-First** - Your data stays on your device
5. **Modern UI** - Beautiful, intuitive interface
6. **Fast** - Instant search, quick auto-fill
7. **Smart** - Auto-categorization and duplicate detection
8. **Private** - Zero tracking, zero telemetry
9. **Secure** - Military-grade encryption
10. **Simple** - Easy setup, no account required

## 📊 Requirements

- Python 3.7+
- Modern browser (Chrome, Firefox, or Edge)
- Windows/Mac/Linux

### Python Dependencies
```
flask
flask-cors
cryptography
bcrypt
pyjwt
```

## 🎮 Keyboard Shortcuts

- `Ctrl+Shift+L` - Trigger auto-fill popup
- `Esc` - Close popup/modal

## 🔧 Configuration

The extension stores settings in browser local storage:
- `authToken` - Authenticated session token
- `theme` - dark/light mode preference
- `autoSaveEnabled` - Enable/disable auto-save (default: true)
- `autoLockTimeout` - Auto-lock time in minutes (default: 5)

## 📝 API Endpoints

See [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md) for complete feature list.

### Authentication
- `POST /api/auth/setup` - Create master password
- `POST /api/auth/login` - Login with master password
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify` - Verify token
- `GET /api/auth/status` - Check auth status

### Passwords
- `GET /api/passwords` - Get all passwords (with filters)
- `POST /api/passwords` - Add password
- `PUT /api/passwords/:id` - Update password
- `DELETE /api/passwords/:id` - Delete password
- `POST /api/passwords/autosave/detect` - Auto-save credentials ⭐ NEW
- `POST /api/passwords/autosave/check` - Check for duplicates ⭐ NEW

### Generator
- `POST /api/generate` - Generate random password
- `POST /api/generate/memorable` - Generate memorable passphrase
- `POST /api/generate/pin` - Generate PIN

### Data
- `GET /api/export` - Export all passwords
- `POST /api/import` - Import passwords
- `GET /api/stats` - Get statistics

## 🐛 Troubleshooting

### Extension doesn't detect forms
- Make sure the backend server is running
- Check that you're logged in to PASSWORD MANAGER
- Refresh the page after installing the extension

### Auto-save doesn't work
- Ensure auto-save is enabled in settings
- Check browser notifications permissions
- Make sure you submitted the form (credentials captured on submit)

### Can't connect to server
- Verify server is running on `http://localhost:5000`
- Check firewall settings
- Ensure Flask dependencies are installed

## 🤝 Contributing

This is an open-source project. Contributions welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - Feel free to use, modify, and distribute!

## 🙏 Credits

Built with ❤️ by the PASSWORD MANAGER Team  
USTHP Edition

---

**PASSWORD MANAGER** - Your passwords, your device, your control. 🔐✨


