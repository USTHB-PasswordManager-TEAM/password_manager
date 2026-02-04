"""
PASSWORD MANAGER - Enhanced Authentication Manager
Features: Bcrypt hashing, JWT tokens, Session management
"""

import os
import hashlib
import secrets
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict


class AuthManager:
    def __init__(
        self,
        master_file: str = "master.key",
        secret_key: Optional[str] = None
    ):
        self.master_file = master_file
        self.secret_key = secret_key or self._load_or_generate_secret()
        self.token_expiry = timedelta(hours=2)
        self.active_sessions: Dict[str, datetime] = {}

    def _load_or_generate_secret(self) -> str:
        """Load or generate JWT secret key."""
        secret_file = "jwt_secret.key"
        if os.path.exists(secret_file):
            with open(secret_file, "r") as f:
                return f.read().strip()
        else:
            secret = secrets.token_hex(32)
            with open(secret_file, "w") as f:
                f.write(secret)
            return secret

    def set_master_password(self, password: str) -> Dict:
        """
        Set master password using bcrypt hashing.
        Much more secure than SHA-256.
        """
        if len(password) < 8:
            return {"error": "Password must be at least 8 characters long"}
        
        # Generate salt and hash password
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode(), salt)
        
        with open(self.master_file, "wb") as f:
            f.write(hashed)
        
        return {"message": "Master password set successfully"}

    def check_master_password(self, password: str) -> bool:
        """Verify master password against stored hash."""
        if not os.path.exists(self.master_file):
            return False
        
        with open(self.master_file, "rb") as f:
            stored_hash = f.read()
        
        try:
            return bcrypt.checkpw(password.encode(), stored_hash)
        except Exception:
            # Fallback for legacy SHA-256 hashes (migration support)
            return self._check_legacy_password(password)

    def _check_legacy_password(self, password: str) -> bool:
        """Check against legacy SHA-256 hash for migration."""
        try:
            with open(self.master_file, "r") as f:
                saved_hash = f.read().strip()
            
            if len(saved_hash) == 64:  # SHA-256 hex length
                if saved_hash == hashlib.sha256(password.encode()).hexdigest():
                    # Migrate to bcrypt
                    self.set_master_password(password)
                    return True
        except Exception:
            pass
        return False

    def master_exists(self) -> bool:
        """Check if master password is set."""
        return os.path.exists(self.master_file)

    def generate_token(self) -> str:
        """Generate JWT token for authenticated session."""
        payload = {
            "exp": datetime.utcnow() + self.token_expiry,
            "iat": datetime.utcnow(),
            "session_id": secrets.token_hex(16)
        }
        token = jwt.encode(payload, self.secret_key, algorithm="HS256")
        self.active_sessions[payload["session_id"]] = datetime.utcnow()
        return token

    def verify_token(self, token: str) -> Dict:
        """Verify JWT token and return payload."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            session_id = payload.get("session_id")
            
            if session_id not in self.active_sessions:
                return {"valid": False, "error": "Session invalidated"}
            
            # Update session activity
            self.active_sessions[session_id] = datetime.utcnow()
            
            return {"valid": True, "payload": payload}
        except jwt.ExpiredSignatureError:
            return {"valid": False, "error": "Token expired"}
        except jwt.InvalidTokenError:
            return {"valid": False, "error": "Invalid token"}

    def invalidate_token(self, token: str) -> Dict:
        """Invalidate a token (logout)."""
        try:
            payload = jwt.decode(
                token, self.secret_key, 
                algorithms=["HS256"],
                options={"verify_exp": False}
            )
            session_id = payload.get("session_id")
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            return {"message": "Logged out successfully"}
        except Exception:
            return {"error": "Invalid token"}

    def change_master_password(
        self, 
        old_password: str, 
        new_password: str
    ) -> Dict:
        """Change master password after verification."""
        if not self.check_master_password(old_password):
            return {"error": "Current password is incorrect"}
        
        result = self.set_master_password(new_password)
        if "error" not in result:
            # Invalidate all sessions
            self.active_sessions.clear()
        
        return result

    def cleanup_sessions(self, max_age_hours: int = 24) -> int:
        """Clean up old sessions."""
        now = datetime.utcnow()
        cutoff = now - timedelta(hours=max_age_hours)
        
        expired = [
            sid for sid, last_active in self.active_sessions.items()
            if last_active < cutoff
        ]
        
        for sid in expired:
            del self.active_sessions[sid]
        
        return len(expired)

    def get_session_count(self) -> int:
        """Get number of active sessions."""
        return len(self.active_sessions)


