**Short description**
A secure desktop application for managing passwords, developed in Python. The application stores user credentials (site name, username, password, notes) in a local encrypted database, unlocked with a single Master Password. The goal is to practice GUI development, secure local storage, and applied cryptography.

**Objectives**

Implement a functional and secure password manager (MVP) with: master-password authentication, encrypted storage, add/edit/delete credentials, password generation, and copy-to-clipboard.

Maintain a clear commit history and iterative development on GitHub.

Demonstrate understanding of encryption (key derivation + symmetric encryption), SQLite usage, and GUI programming.

**MVP Features**

Create / set Master Password (first run).

Master Password verification (PBKDF2) and symmetric encryption (Fernet/AES).

Store credentials in a local SQLite database (encrypted password field).

GUI: list entries, add, edit, delete, view password, copy password to clipboard.

Password generator (configurable length, with/without symbols).

**Tech stack**

Language: Python 3.8+

GUI: Tkinter (or PyQt/customtkinter for advanced UI)

Database: SQLite (sqlite3)

Cryptography: cryptography library (PBKDF2HMAC + Fernet)

Tools: Git, GitHub

Team

**Team members**
ABDELMADJID BAGHDALI 
ISLAM MERZOUK 
