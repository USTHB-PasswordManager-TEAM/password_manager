/**
 * PASSWORD MANAGER - Settings & Configuration
 * Advanced settings and preferences
 */

// Default settings
const DEFAULT_SETTINGS = {
    // Security
    autoLockEnabled: true,
    autoLockTimeout: 5, // minutes
    requireMasterOnFill: false,
    clipboardTimeout: 30, // seconds
    
    // Auto-save
    autoSaveEnabled: true,
    autoSavePromptDuration: 15, // seconds
    autoSaveIgnoreDuplicates: true,
    autoSaveCategories: true, // auto-categorize
    
    // UI/UX
    theme: 'dark',
    animations: true,
    notifications: true,
    soundEffects: false,
    compactMode: false,
    
    // Auto-fill
    autoFillEnabled: true,
    autoFillOnFocus: false,
    showIconOnFields: true,
    keyboardShortcutEnabled: true,
    
    // Password Generator
    defaultLength: 16,
    defaultLowercase: true,
    defaultUppercase: true,
    defaultDigits: true,
    defaultSpecial: true,
    defaultExcludeAmbiguous: false,
    
    // Advanced
    debugMode: false,
    telemetry: false, // always false for privacy
    backupReminder: true,
    backupInterval: 30 // days
};

// Settings Manager
class SettingsManager {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.loadSettings();
    }
    
    async loadSettings() {
        const stored = await chrome.storage.local.get('settings');
        if (stored.settings) {
            this.settings = { ...DEFAULT_SETTINGS, ...stored.settings };
        }
    }
    
    async saveSettings() {
        await chrome.storage.local.set({ settings: this.settings });
    }
    
    get(key) {
        return this.settings[key];
    }
    
    async set(key, value) {
        this.settings[key] = value;
        await this.saveSettings();
    }
    
    async reset() {
        this.settings = { ...DEFAULT_SETTINGS };
        await this.saveSettings();
    }
    
    export() {
        return JSON.stringify(this.settings, null, 2);
    }
    
    import(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.settings = { ...DEFAULT_SETTINGS, ...imported };
            this.saveSettings();
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}

// Password Health Checker
class PasswordHealthChecker {
    constructor() {
        this.weakPatterns = [
            /^[a-z]+$/,           // only lowercase
            /^[A-Z]+$/,           // only uppercase
            /^[0-9]+$/,           // only numbers
            /^(.)\1+$/,           // repeated characters
            /^(012|123|234|345|456|567|678|789|890)+$/, // sequential
            /^(qwerty|asdfgh|zxcvbn)+$/i, // keyboard patterns
        ];
        
        this.commonPasswords = [
            'password', 'password123', '123456', '12345678',
            'qwerty', 'abc123', 'monkey', '1234567890',
            'letmein', 'trustno1', 'dragon', 'baseball',
            'iloveyou', 'master', 'sunshine', 'ashley'
        ];
    }
    
    checkStrength(password) {
        if (!password) return { score: 0, level: 'None', feedback: [] };
        
        const feedback = [];
        let score = 0;
        
        // Length check
        if (password.length >= 12) score += 2;
        else if (password.length >= 8) score += 1;
        else feedback.push('Too short (min 8 characters)');
        
        // Character variety
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Add lowercase letters');
        
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Add uppercase letters');
        
        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('Add numbers');
        
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;
        else feedback.push('Add special characters');
        
        // Check for weak patterns
        if (this.weakPatterns.some(pattern => pattern.test(password))) {
            score -= 2;
            feedback.push('Avoid simple patterns');
        }
        
        // Check common passwords
        if (this.commonPasswords.includes(password.toLowerCase())) {
            score = 0;
            feedback.push('This is a commonly used password!');
        }
        
        // Determine level
        let level = 'Weak';
        if (score >= 6) level = 'Very Strong';
        else if (score >= 5) level = 'Strong';
        else if (score >= 3) level = 'Medium';
        
        return { score, level, feedback };
    }
    
    findWeakPasswords(passwords) {
        return passwords.filter(pwd => {
            const health = this.checkStrength(pwd.password);
            return health.score < 3;
        });
    }
    
    findReusedPasswords(passwords) {
        const passwordMap = new Map();
        const reused = [];
        
        passwords.forEach(pwd => {
            const existing = passwordMap.get(pwd.password);
            if (existing) {
                if (!reused.includes(pwd.password)) {
                    reused.push({ password: pwd.password, sites: [existing, pwd.website] });
                } else {
                    const entry = reused.find(r => r.password === pwd.password);
                    entry.sites.push(pwd.website);
                }
            } else {
                passwordMap.set(pwd.password, pwd.website);
            }
        });
        
        return reused;
    }
    
    calculateSecurityScore(passwords) {
        if (passwords.length === 0) return 100;
        
        const weak = this.findWeakPasswords(passwords);
        const reused = this.findReusedPasswords(passwords);
        
        let score = 100;
        score -= (weak.length / passwords.length) * 30; // -30 for weak passwords
        score -= (reused.length / passwords.length) * 40; // -40 for reused
        
        return Math.max(0, Math.round(score));
    }
}

// Backup Manager
class BackupManager {
    constructor() {
        this.lastBackup = null;
        this.loadLastBackupDate();
    }
    
    async loadLastBackupDate() {
        const stored = await chrome.storage.local.get('lastBackupDate');
        this.lastBackup = stored.lastBackupDate ? new Date(stored.lastBackupDate) : null;
    }
    
    async setLastBackupDate() {
        this.lastBackup = new Date();
        await chrome.storage.local.set({ lastBackupDate: this.lastBackup.toISOString() });
    }
    
    shouldRemind(intervalDays = 30) {
        if (!this.lastBackup) return true;
        
        const daysSinceBackup = (Date.now() - this.lastBackup.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceBackup >= intervalDays;
    }
    
    getDaysSinceBackup() {
        if (!this.lastBackup) return Infinity;
        return Math.floor((Date.now() - this.lastBackup.getTime()) / (1000 * 60 * 60 * 24));
    }
}

// Category Manager
class CategoryManager {
    constructor() {
        this.defaultCategories = [
            { name: 'General', icon: '📁', color: '#7E57C2' },
            { name: 'Social Media', icon: '📱', color: '#E91E63' },
            { name: 'Email', icon: '📧', color: '#2196F3' },
            { name: 'Banking', icon: '🏦', color: '#4CAF50' },
            { name: 'Shopping', icon: '🛒', color: '#FF9800' },
            { name: 'Work', icon: '💼', color: '#607D8B' },
            { name: 'Entertainment', icon: '🎮', color: '#9C27B0' },
            { name: 'Other', icon: '📌', color: '#795548' }
        ];
    }
    
    detectCategory(website) {
        const siteLower = website.toLowerCase();
        
        const categories = {
            'Social Media': ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 
                           'reddit', 'snapchat', 'youtube', 'pinterest', 'whatsapp'],
            'Email': ['gmail', 'outlook', 'yahoo', 'protonmail', 'mail', 'icloud'],
            'Banking': ['bank', 'paypal', 'stripe', 'square', 'wise', 'revolut', 
                       'crypto', 'binance', 'coinbase', 'kraken'],
            'Shopping': ['amazon', 'ebay', 'etsy', 'shopify', 'target', 'walmart', 
                        'aliexpress', 'alibaba', 'wish'],
            'Work': ['github', 'gitlab', 'bitbucket', 'jira', 'slack', 'asana', 
                    'trello', 'notion', 'confluence', 'monday'],
            'Entertainment': ['netflix', 'hulu', 'disney', 'spotify', 'twitch', 
                            'discord', 'steam', 'epicgames', 'xbox', 'playstation']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => siteLower.includes(keyword))) {
                return category;
            }
        }
        
        return 'General';
    }
    
    getCategoryIcon(categoryName) {
        const category = this.defaultCategories.find(c => c.name === categoryName);
        return category ? category.icon : '🔑';
    }
    
    getCategoryColor(categoryName) {
        const category = this.defaultCategories.find(c => c.name === categoryName);
        return category ? category.color : '#7E57C2';
    }
}

// Security Utilities
class SecurityUtils {
    // Generate cryptographically secure random string
    static generateSecureRandom(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Check if password has been compromised (basic check)
    static async checkPasswordBreach(password) {
        // In production, use Have I Been Pwned API
        // This is a placeholder
        const commonLeaks = ['password', '123456', 'qwerty'];
        return commonLeaks.includes(password.toLowerCase());
    }
    
    // Calculate password entropy
    static calculateEntropy(password) {
        if (!password) return 0;
        
        let charsetSize = 0;
        if (/[a-z]/.test(password)) charsetSize += 26;
        if (/[A-Z]/.test(password)) charsetSize += 26;
        if (/[0-9]/.test(password)) charsetSize += 10;
        if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
        
        return password.length * Math.log2(charsetSize);
    }
    
    // Estimate time to crack
    static estimateCrackTime(password) {
        const entropy = this.calculateEntropy(password);
        const guessesPerSecond = 1e9; // 1 billion guesses/sec
        const seconds = Math.pow(2, entropy) / guessesPerSecond;
        
        if (seconds < 60) return 'Instantly';
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
        if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
        return 'Centuries';
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SettingsManager,
        PasswordHealthChecker,
        BackupManager,
        CategoryManager,
        SecurityUtils
    };
}


