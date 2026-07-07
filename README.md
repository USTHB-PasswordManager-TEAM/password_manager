# 🔐 Secure Password Manager

A secure desktop application for managing passwords, developed in **Python**. The application stores user credentials (site name, username, password, and notes) in a local encrypted SQLite database protected by a single **Master Password**. This project was developed to practice GUI development, secure local storage, and applied cryptography.

<p align="center">
  <img src="https://skillicons.dev/icons?i=python,sqlite,git,github,vscode" />
</p>

---

## 🎯 Objectives

- Develop a functional and secure password manager (MVP).
- Implement master-password authentication.
- Encrypt stored credentials using modern cryptography.
- Manage credentials (add, edit, delete, and view).
- Generate strong passwords.
- Copy passwords securely to the clipboard.
- Maintain a clean GitHub commit history and iterative development.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔑 **Master Password** | Create a master password on first launch and verify it on every login. |
| 🔒 **Secure Encryption** | Uses PBKDF2 for key derivation and Fernet symmetric encryption to protect stored passwords. |
| 💾 **Encrypted Database** | Credentials are stored in a local SQLite database with encrypted password fields. |
| 🖥️ **Desktop GUI** | Simple interface to add, edit, delete, search, and manage credentials. |
| 👁️ **Password Visibility** | Show or hide passwords when needed. |
| 📋 **Copy to Clipboard** | Quickly copy passwords to the clipboard. |
| 🔐 **Password Generator** | Generate strong passwords with configurable length and optional symbols. |

---

## 🛠️ Tech Stack

<p align="left">
  <img src="https://skillicons.dev/icons?i=python,sqlite,git,github,vscode" />
</p>

| Category | Technology |
|----------|------------|
| **Language** | Python 3.8+ |
| **GUI** | Tkinter *(or PyQt / CustomTkinter)* |
| **Database** | SQLite (`sqlite3`) |
| **Cryptography** | `cryptography` (PBKDF2HMAC + Fernet) |
| **Version Control** | Git & GitHub |

---

## 👥 Team

- **ABDELMADJID BAGHDALI**
- **ISLAM MERZOUK**
