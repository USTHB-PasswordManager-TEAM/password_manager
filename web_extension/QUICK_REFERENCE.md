# 🚀 PASSWORD MANAGER - Quick Reference

## ⚡ Quick Start (1 Minute)
```bash
1. cd web_extension/backend && python app.py
2. Load extension in browser (chrome://extensions/)
3. Click PASSWORD MANAGER icon → Create master password
4. Done! 🎉
```

## 🎯 Essential Commands

### Auto-Save Password
```
1. Login to any website normally
2. Submit form
3. Click "Save" in notification
✅ Password saved!
```

### Auto-Fill Password
```
Method 1: Click 🔐 icon in password field
Method 2: Press Ctrl+Shift+L
Method 3: Right-click → "PASSWORD MANAGER Auto-fill"
```

### Generate Password
```
1. Click PASSWORD MANAGER icon
2. Click "🎲 Generate"
3. Copy or use directly
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+L` | Open auto-fill |
| `Esc` | Close popup |

## 📁 Categories (Auto-Detected)

| Icon | Category | Examples |
|------|----------|----------|
| 📱 | Social Media | Facebook, Twitter, Instagram |
| 📧 | Email | Gmail, Outlook, Yahoo |
| 🏦 | Banking | PayPal, Banks, Crypto |
| 🛒 | Shopping | Amazon, eBay, Etsy |
| 💼 | Work | GitHub, Slack, Jira |
| 🎮 | Entertainment | Netflix, Spotify, Steam |
| 📁 | General | Everything else |

## 🔐 Security Features

✅ AES-256 Encryption  
✅ Zero-Knowledge Architecture  
✅ Auto-Lock (5 min)  
✅ bcrypt Master Password  
✅ Local-First (No Cloud)  
✅ Open Source  

## 💡 Pro Tips

1. **Use Generator**: Always generate passwords (🎲 button)
2. **Star Favorites**: Quick access to common sites (⭐)
3. **Backup Monthly**: Export → Save JSON file
4. **Lock When Done**: Click 🚪 to logout
5. **Search Fast**: Just start typing in search box

## 🐛 Common Issues

### "Can't connect"
```bash
# Start backend server:
cd web_extension/backend
python app.py
```

### "Not saving passwords"
- ✓ Check server is running
- ✓ Check you're logged in
- ✓ Check notifications enabled

### "Icon not showing"
- Refresh the webpage
- Reload extension

## 📊 API Endpoints (Developers)

```
POST /api/auth/setup          - Create master password
POST /api/auth/login          - Login
GET  /api/passwords           - Get all passwords
POST /api/passwords           - Add password
POST /api/passwords/autosave/detect - Auto-save ⭐
POST /api/generate            - Generate password
GET  /api/export              - Export backup
```

## 🎨 UI Elements

```
🔐 - PASSWORD MANAGER Icon (login forms)
🌙 - Theme toggle
⚙️ - Settings
🚪 - Logout
🔍 - Search
➕ - Add password
🎲 - Generate password
⭐ - Favorite
📋 - Copy
👁️ - Show/hide password
```

## 📦 File Structure

```
web_extension/
├── backend/
│   ├── app.py              # API server
│   ├── database_manager.py # DB + encryption
│   └── requirements.txt    # Dependencies
├── extension/
│   ├── popup/              # Main UI
│   ├── content/            # Auto-save/fill
│   └── background/         # Service worker
└── README.md
```

## 🎓 Learn More

- [README.md](README.md) - Full setup guide
- [USER_GUIDE.md](USER_GUIDE.md) - Complete manual
- [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md) - Feature list

## ⚠️ Remember

1. **Master Password** - NEVER forget it!
2. **Backup** - Export monthly
3. **Update** - Keep PASSWORD MANAGER updated
4. **Report** - Found a bug? Let us know!

---

**PASSWORD MANAGER** - The Best Password Manager Ever! 🔐✨

Quick help: Press Ctrl+Shift+L on any login form!

