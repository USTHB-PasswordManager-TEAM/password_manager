"""
PASSWORD MANAGER - Enhanced Database Manager
Features: Encryption, Categories, Search, Export/Import
"""

import sqlite3
import json
import os
from datetime import datetime
from cryptography.fernet import Fernet
from typing import List, Dict, Optional, Tuple


class DatabaseManager:
    def __init__(self, db_file: str = "passwords.db", key_file: str = "key.key"):
        self.db_file = db_file
        self.key_file = key_file
        self.conn = sqlite3.connect(self.db_file, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self.create_tables()
        self.key = self.load_key()

    def create_tables(self) -> None:
        """Create all necessary tables for the password manager."""
        # Main passwords table with enhanced fields
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                website TEXT NOT NULL,
                url TEXT,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                category TEXT DEFAULT 'General',
                notes TEXT,
                favorite INTEGER DEFAULT 0,
                auto_saved INTEGER DEFAULT 0,
                breach_check_result TEXT,
                strength_score INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Categories table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                icon TEXT DEFAULT '📁',
                color TEXT DEFAULT '#7E57C2'
            )
        ''')
        
        # Insert default categories
        default_categories = [
            ('General', '📁', '#7E57C2'),
            ('Social Media', '📱', '#E91E63'),
            ('Email', '📧', '#2196F3'),
            ('Banking', '🏦', '#4CAF50'),
            ('Shopping', '🛒', '#FF9800'),
            ('Work', '💼', '#607D8B'),
            ('Entertainment', '🎮', '#9C27B0'),
            ('Other', '📌', '#795548')
        ]
        
        for cat in default_categories:
            try:
                self.cursor.execute(
                    "INSERT OR IGNORE INTO categories (name, icon, color) VALUES (?, ?, ?)",
                    cat
                )
            except sqlite3.IntegrityError:
                pass
        
        self.conn.commit()

    def load_key(self) -> bytes:
        """Load or generate encryption key."""
        if not os.path.exists(self.key_file):
            key = Fernet.generate_key()
            with open(self.key_file, "wb") as f:
                f.write(key)
        else:
            with open(self.key_file, "rb") as f:
                key = f.read()
        return key

    def encrypt(self, text: str) -> str:
        """Encrypt text using Fernet encryption."""
        return Fernet(self.key).encrypt(text.encode()).decode()

    def decrypt(self, text: str) -> str:
        """Decrypt text using Fernet encryption."""
        try:
            return Fernet(self.key).decrypt(text.encode()).decode()
        except Exception:
            return "***DECRYPTION_ERROR***"

    def add_password(
        self,
        website: str,
        username: str,
        password: str,
        url: str = "",
        category: str = "General",
        notes: str = "",
        auto_saved: bool = False
    ) -> Dict:
        """Add a new password entry."""
        encrypted_password = self.encrypt(password)
        self.cursor.execute(
            """INSERT INTO passwords 
               (website, url, username, password, category, notes, auto_saved) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (website, url, username, encrypted_password, category, notes, 1 if auto_saved else 0)
        )
        self.conn.commit()
        return {
            "id": self.cursor.lastrowid,
            "website": website,
            "url": url,
            "username": username,
            "category": category,
            "notes": notes,
            "auto_saved": auto_saved,
            "message": "Password added successfully"
        }

    def get_passwords(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        favorites_only: bool = False
    ) -> List[Dict]:
        """Get all passwords with optional filters."""
        query = """SELECT id, website, url, username, password, category, 
                   notes, favorite, created_at, updated_at 
                   FROM passwords WHERE 1=1"""
        params = []

        if search:
            query += " AND (website LIKE ? OR username LIKE ? OR notes LIKE ?)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term])

        if category:
            query += " AND category = ?"
            params.append(category)

        if favorites_only:
            query += " AND favorite = 1"

        query += " ORDER BY website ASC"

        self.cursor.execute(query, params)
        rows = self.cursor.fetchall()

        passwords = []
        for row in rows:
            passwords.append({
                "id": row[0],
                "website": row[1],
                "url": row[2],
                "username": row[3],
                "password": self.decrypt(row[4]),
                "category": row[5],
                "notes": row[6],
                "favorite": bool(row[7]),
                "created_at": row[8],
                "updated_at": row[9]
            })

        return passwords

    def get_password_by_id(self, password_id: int) -> Optional[Dict]:
        """Get a single password by ID."""
        self.cursor.execute(
            """SELECT id, website, url, username, password, category, 
               notes, favorite, created_at, updated_at 
               FROM passwords WHERE id = ?""",
            (password_id,)
        )
        row = self.cursor.fetchone()
        
        if row:
            return {
                "id": row[0],
                "website": row[1],
                "url": row[2],
                "username": row[3],
                "password": self.decrypt(row[4]),
                "category": row[5],
                "notes": row[6],
                "favorite": bool(row[7]),
                "created_at": row[8],
                "updated_at": row[9]
            }
        return None

    def update_password(
        self,
        password_id: int,
        website: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        url: Optional[str] = None,
        category: Optional[str] = None,
        notes: Optional[str] = None,
        favorite: Optional[bool] = None
    ) -> Dict:
        """Update an existing password entry."""
        updates = []
        params = []

        if website is not None:
            updates.append("website = ?")
            params.append(website)
        if username is not None:
            updates.append("username = ?")
            params.append(username)
        if password is not None:
            updates.append("password = ?")
            params.append(self.encrypt(password))
        if url is not None:
            updates.append("url = ?")
            params.append(url)
        if category is not None:
            updates.append("category = ?")
            params.append(category)
        if notes is not None:
            updates.append("notes = ?")
            params.append(notes)
        if favorite is not None:
            updates.append("favorite = ?")
            params.append(1 if favorite else 0)

        if not updates:
            return {"error": "No fields to update"}

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(password_id)

        query = f"UPDATE passwords SET {', '.join(updates)} WHERE id = ?"
        self.cursor.execute(query, params)
        self.conn.commit()

        return {"message": "Password updated successfully", "id": password_id}

    def delete_password(self, password_id: int) -> Dict:
        """Delete a password by ID."""
        self.cursor.execute("DELETE FROM passwords WHERE id = ?", (password_id,))
        self.conn.commit()
        return {"message": "Password deleted successfully", "id": password_id}

    def toggle_favorite(self, password_id: int) -> Dict:
        """Toggle favorite status of a password."""
        self.cursor.execute(
            "UPDATE passwords SET favorite = NOT favorite WHERE id = ?",
            (password_id,)
        )
        self.conn.commit()
        return {"message": "Favorite toggled", "id": password_id}

    def get_categories(self) -> List[Dict]:
        """Get all categories."""
        self.cursor.execute("SELECT id, name, icon, color FROM categories")
        rows = self.cursor.fetchall()
        return [
            {"id": row[0], "name": row[1], "icon": row[2], "color": row[3]}
            for row in rows
        ]

    def add_category(self, name: str, icon: str = "📁", color: str = "#7E57C2") -> Dict:
        """Add a new category."""
        try:
            self.cursor.execute(
                "INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)",
                (name, icon, color)
            )
            self.conn.commit()
            return {"id": self.cursor.lastrowid, "name": name, "icon": icon, "color": color}
        except sqlite3.IntegrityError:
            return {"error": "Category already exists"}

    def export_passwords(self) -> List[Dict]:
        """Export all passwords (encrypted) for backup."""
        passwords = self.get_passwords()
        # Re-encrypt for export security
        for p in passwords:
            p['password'] = self.encrypt(p['password'])
        return passwords

    def import_passwords(self, passwords: List[Dict]) -> Dict:
        """Import passwords from backup."""
        imported = 0
        for p in passwords:
            try:
                # Decrypt if encrypted, otherwise use as-is
                try:
                    decrypted_pass = self.decrypt(p['password'])
                except:
                    decrypted_pass = p['password']
                
                self.add_password(
                    website=p.get('website', ''),
                    username=p.get('username', ''),
                    password=decrypted_pass,
                    url=p.get('url', ''),
                    category=p.get('category', 'General'),
                    notes=p.get('notes', '')
                )
                imported += 1
            except Exception as e:
                continue
        
        return {"message": f"Imported {imported} passwords"}

    def get_statistics(self) -> Dict:
        """Get password statistics."""
        self.cursor.execute("SELECT COUNT(*) FROM passwords")
        total = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT COUNT(*) FROM passwords WHERE favorite = 1")
        favorites = self.cursor.fetchone()[0]

        self.cursor.execute(
            "SELECT category, COUNT(*) FROM passwords GROUP BY category"
        )
        by_category = {row[0]: row[1] for row in self.cursor.fetchall()}

        return {
            "total": total,
            "favorites": favorites,
            "by_category": by_category
        }

    def find_similar_password(self, website: str, username: Optional[str] = None) -> Optional[Dict]:
        """Find if similar password already exists for website."""
        if username:
            self.cursor.execute(
                """SELECT id, website, url, username, password, category, 
                   notes, favorite, created_at, updated_at 
                   FROM passwords WHERE website = ? AND username = ?""",
                (website, username)
            )
        else:
            self.cursor.execute(
                """SELECT id, website, url, username, password, category, 
                   notes, favorite, created_at, updated_at 
                   FROM passwords WHERE website = ?""",
                (website,)
            )
        
        row = self.cursor.fetchone()
        if row:
            return {
                "id": row[0],
                "website": row[1],
                "url": row[2],
                "username": row[3],
                "password": self.decrypt(row[4]),
                "category": row[5],
                "notes": row[6],
                "favorite": bool(row[7]),
                "created_at": row[8],
                "updated_at": row[9]
            }
        return None

    def get_weak_passwords(self, strength_threshold: int = 2) -> List[Dict]:
        """Get all weak passwords below threshold."""
        self.cursor.execute(
            """SELECT id, website, url, username, password, category, 
               notes, favorite, created_at, updated_at 
               FROM passwords WHERE strength_score < ? 
               ORDER BY strength_score ASC""",
            (strength_threshold,)
        )
        rows = self.cursor.fetchall()
        
        passwords = []
        for row in rows:
            passwords.append({
                "id": row[0],
                "website": row[1],
                "url": row[2],
                "username": row[3],
                "password": self.decrypt(row[4]),
                "category": row[5],
                "notes": row[6],
                "favorite": bool(row[7]),
                "created_at": row[8],
                "updated_at": row[9]
            })
        
        return passwords

    def get_auto_saved_passwords(self) -> List[Dict]:
        """Get all auto-saved passwords."""
        self.cursor.execute(
            """SELECT id, website, url, username, password, category, 
               notes, favorite, created_at, updated_at 
               FROM passwords WHERE auto_saved = 1 
               ORDER BY created_at DESC"""
        )
        rows = self.cursor.fetchall()
        
        passwords = []
        for row in rows:
            passwords.append({
                "id": row[0],
                "website": row[1],
                "url": row[2],
                "username": row[3],
                "password": self.decrypt(row[4]),
                "category": row[5],
                "notes": row[6],
                "favorite": bool(row[7]),
                "created_at": row[8],
                "updated_at": row[9]
            })
        
        return passwords

    def close(self) -> None:
        """Close database connection."""
        self.conn.close()


