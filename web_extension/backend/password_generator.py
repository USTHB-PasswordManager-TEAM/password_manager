"""
PASSWORD MANAGER - Password Generator
Features: Customizable generation, Strength analysis, Memorable passwords
"""

import secrets
import string
import re
from typing import Dict, List, Optional


class PasswordGenerator:
    def __init__(self):
        self.lowercase = string.ascii_lowercase
        self.uppercase = string.ascii_uppercase
        self.digits = string.digits
        self.special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        self.ambiguous = "0O1lI"  # Characters that look similar
        
        # Word list for memorable passwords
        self.words = [
            "apple", "banana", "cherry", "dragon", "eagle", "forest",
            "garden", "harbor", "island", "jungle", "kingdom", "lemon",
            "mountain", "night", "ocean", "planet", "queen", "river",
            "sunset", "thunder", "umbrella", "village", "winter", "xenon",
            "yellow", "zebra", "cloud", "dream", "energy", "flame",
            "guitar", "horizon", "impulse", "journey", "karma", "lightning",
            "magic", "nebula", "odyssey", "phoenix", "quantum", "rainbow",
            "silver", "tornado", "universe", "vortex", "whisper", "crystal",
            "diamond", "emerald", "falcon", "glacier", "hunter", "infinity"
        ]

    def generate(
        self,
        length: int = 16,
        use_lowercase: bool = True,
        use_uppercase: bool = True,
        use_digits: bool = True,
        use_special: bool = True,
        exclude_ambiguous: bool = False,
        custom_chars: str = ""
    ) -> str:
        """Generate a random password with specified options."""
        charset = ""
        
        if use_lowercase:
            charset += self.lowercase
        if use_uppercase:
            charset += self.uppercase
        if use_digits:
            charset += self.digits
        if use_special:
            charset += self.special
        if custom_chars:
            charset += custom_chars
            
        if exclude_ambiguous:
            charset = "".join(c for c in charset if c not in self.ambiguous)
        
        if not charset:
            charset = self.lowercase + self.uppercase + self.digits
        
        # Ensure at least one character from each selected type
        password = []
        if use_lowercase:
            chars = self.lowercase
            if exclude_ambiguous:
                chars = "".join(c for c in chars if c not in self.ambiguous)
            password.append(secrets.choice(chars))
        if use_uppercase:
            chars = self.uppercase
            if exclude_ambiguous:
                chars = "".join(c for c in chars if c not in self.ambiguous)
            password.append(secrets.choice(chars))
        if use_digits:
            chars = self.digits
            if exclude_ambiguous:
                chars = "".join(c for c in chars if c not in self.ambiguous)
            password.append(secrets.choice(chars))
        if use_special:
            password.append(secrets.choice(self.special))
        
        # Fill remaining length
        remaining = length - len(password)
        password.extend(secrets.choice(charset) for _ in range(max(0, remaining)))
        
        # Shuffle the password
        password_list = list(password)
        secrets.SystemRandom().shuffle(password_list)
        
        return "".join(password_list)

    def generate_memorable(
        self,
        word_count: int = 4,
        separator: str = "-",
        capitalize: bool = True,
        add_number: bool = True
    ) -> str:
        """Generate a memorable passphrase."""
        selected_words = [secrets.choice(self.words) for _ in range(word_count)]
        
        if capitalize:
            selected_words = [word.capitalize() for word in selected_words]
        
        passphrase = separator.join(selected_words)
        
        if add_number:
            passphrase += separator + str(secrets.randbelow(100))
        
        return passphrase

    def generate_pin(self, length: int = 6) -> str:
        """Generate a numeric PIN."""
        return "".join(secrets.choice(self.digits) for _ in range(length))

    def check_strength(self, password: str) -> Dict:
        """
        Analyze password strength and provide feedback.
        Returns score (0-100) and recommendations.
        """
        score = 0
        feedback = []
        
        # Length scoring
        length = len(password)
        if length >= 8:
            score += 10
        if length >= 12:
            score += 15
        if length >= 16:
            score += 15
        if length >= 20:
            score += 10
        
        if length < 8:
            feedback.append("Password should be at least 8 characters long")
        
        # Character variety
        has_lower = bool(re.search(r'[a-z]', password))
        has_upper = bool(re.search(r'[A-Z]', password))
        has_digit = bool(re.search(r'\d', password))
        has_special = bool(re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password))
        
        if has_lower:
            score += 10
        else:
            feedback.append("Add lowercase letters")
            
        if has_upper:
            score += 10
        else:
            feedback.append("Add uppercase letters")
            
        if has_digit:
            score += 10
        else:
            feedback.append("Add numbers")
            
        if has_special:
            score += 15
        else:
            feedback.append("Add special characters")
        
        # Penalty for common patterns
        # Repeated characters
        if re.search(r'(.)\1{2,}', password):
            score -= 10
            feedback.append("Avoid repeated characters")
        
        # Sequential numbers
        if re.search(r'(012|123|234|345|456|567|678|789|890)', password):
            score -= 10
            feedback.append("Avoid sequential numbers")
        
        # Sequential letters
        if re.search(r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', password.lower()):
            score -= 10
            feedback.append("Avoid sequential letters")
        
        # Common passwords patterns
        common_patterns = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome']
        for pattern in common_patterns:
            if pattern in password.lower():
                score -= 20
                feedback.append("Avoid common password patterns")
                break
        
        # Ensure score is within bounds
        score = max(0, min(100, score))
        
        # Determine strength level
        if score >= 80:
            strength = "Very Strong"
            color = "#4CAF50"
        elif score >= 60:
            strength = "Strong"
            color = "#8BC34A"
        elif score >= 40:
            strength = "Medium"
            color = "#FF9800"
        elif score >= 20:
            strength = "Weak"
            color = "#FF5722"
        else:
            strength = "Very Weak"
            color = "#F44336"
        
        return {
            "score": score,
            "strength": strength,
            "color": color,
            "feedback": feedback,
            "details": {
                "length": length,
                "has_lowercase": has_lower,
                "has_uppercase": has_upper,
                "has_digits": has_digit,
                "has_special": has_special
            }
        }

    def suggest_improvements(self, password: str) -> str:
        """Suggest an improved version of the password."""
        improved = list(password)
        
        # Add missing character types
        if not re.search(r'[A-Z]', password):
            improved.insert(secrets.randbelow(len(improved) + 1), secrets.choice(self.uppercase))
        
        if not re.search(r'\d', password):
            improved.insert(secrets.randbelow(len(improved) + 1), secrets.choice(self.digits))
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
            improved.insert(secrets.randbelow(len(improved) + 1), secrets.choice(self.special))
        
        # Extend if too short
        while len(improved) < 12:
            improved.append(secrets.choice(self.lowercase + self.uppercase + self.digits))
        
        return "".join(improved)


