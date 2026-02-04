/**
 * PASSWORD MANAGER - Background Service Worker
 * Handles extension lifecycle, auto-lock, and API communication
 */

// =====================================
// Constants
// =====================================
const API_BASE = 'http://localhost:5000/api';
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
let lockTimer = null;

// =====================================
// Event Listeners
// =====================================

// Extension installed
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('PASSWORD MANAGER installed');
        chrome.storage.local.set({
            theme: 'dark',
            autoLockEnabled: true,
            autoLockTimeout: 5,
            autoFillEnabled: true
        });
    }
    createContextMenus();
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'RESET_LOCK_TIMER':
            resetLockTimer();
            sendResponse({ success: true });
            break;
            
        case 'GET_CURRENT_TAB_URL':
            getCurrentTabUrl().then(url => sendResponse({ url }));
            return true;
            
        case 'GET_CURRENT_TAB_INFO':
            getCurrentTabInfo().then(info => sendResponse(info));
            return true;
            
        case 'FILL_PASSWORD':
            fillPassword(message.data, sender.tab?.id);
            sendResponse({ success: true });
            break;
            
        case 'GET_PASSWORDS_FOR_SITE':
            getPasswordsForSite(message.hostname).then(result => sendResponse(result));
            return true;
            
        case 'LOGIN_FORM_DETECTED':
            handleLoginFormDetected(message.hostname, sender.tab?.id);
            sendResponse({ success: true });
            break;
            
        case 'OPEN_POPUP':
            chrome.action.openPopup();
            sendResponse({ success: true });
            break;
            
        case 'SHOW_AUTO_SAVE_PROMPT':
            showAutoSavePrompt(message.credentials, sender.tab?.id).then(result => {
                sendResponse(result || { save: false });
            });
            return true;
            
        case 'AUTO_SAVE_CREDENTIALS':
            autoSaveCredentials(message.credentials).then(result => {
                sendResponse(result || { success: false });
            });
            return true;
        
        case 'SAVE_CREDENTIALS_NOW':
            // New immediate save - no prompt, just save directly
            saveCredentialsImmediately(message.credentials).then(result => {
                sendResponse(result || { success: false });
            });
            return true;
            
        default:
            sendResponse({ error: 'Unknown message type' });
    }
});

// Tab updated - inject content script and check pending credentials
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        injectContentScript(tabId, tab.url);
        // Check for pending credentials to save
        checkAndSavePendingCredentials();
    }
});

// Check for pending credentials on startup
chrome.runtime.onStartup.addListener(() => {
    console.log('🔐 PASSWORD MANAGER: Extension started');
    checkAndSavePendingCredentials();
});

// Function to check and save any pending credentials
async function checkAndSavePendingCredentials() {
    try {
        const result = await chrome.storage.local.get(['pendingCredentials', 'authToken']);
        
        if (result.pendingCredentials && result.authToken) {
            const creds = result.pendingCredentials;
            const timeDiff = Date.now() - (creds.timestamp || 0);
            
            // Only process if less than 60 seconds old
            if (timeDiff < 60000) {
                console.log('🔐 PASSWORD MANAGER: Found pending credentials, attempting to save...');
                const saveResult = await saveCredentialsImmediately(creds);
                
                if (saveResult.success) {
                    console.log('🔐 PASSWORD MANAGER: Pending credentials saved successfully');
                } else if (saveResult.duplicate) {
                    console.log('🔐 PASSWORD MANAGER: Credentials already exist');
                }
            }
            
            // Clear pending credentials
            await chrome.storage.local.remove('pendingCredentials');
        }
    } catch (error) {
        console.error('🔐 PASSWORD MANAGER: Error checking pending credentials:', error);
    }
}

// =====================================
// API Communication
// =====================================
async function getPasswordsForSite(hostname) {
    try {
        const { authToken } = await chrome.storage.local.get('authToken');
        
        if (!authToken) {
            return { error: 'Not authenticated', needsLogin: true };
        }
        
        const response = await fetch(`${API_BASE}/passwords?search=${encodeURIComponent(hostname)}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                return { error: 'Session expired', needsLogin: true };
            }
            throw new Error('Failed to fetch passwords');
        }
        
        const data = await response.json();
        
        // Filter passwords that match the hostname
        const matchingPasswords = data.passwords.filter(pwd => {
            const pwdHostname = extractHostname(pwd.url || pwd.website);
            return hostnameMatches(hostname, pwdHostname) || 
                   pwd.website.toLowerCase().includes(hostname.toLowerCase()) ||
                   hostname.toLowerCase().includes(pwd.website.toLowerCase());
        });
        
        return { passwords: matchingPasswords };
    } catch (error) {
        console.error('Error fetching passwords:', error);
        return { error: 'Server unavailable', serverError: true };
    }
}

function extractHostname(urlOrName) {
    try {
        if (urlOrName.startsWith('http')) {
            return new URL(urlOrName).hostname;
        }
        return urlOrName.toLowerCase().replace(/\s+/g, '');
    } catch {
        return urlOrName.toLowerCase().replace(/\s+/g, '');
    }
}

function hostnameMatches(current, saved) {
    if (!current || !saved) return false;
    
    current = current.toLowerCase();
    saved = saved.toLowerCase();
    
    if (current === saved) return true;
    
    const currentClean = current.replace(/^www\./, '');
    const savedClean = saved.replace(/^www\./, '');
    
    if (currentClean === savedClean) return true;
    if (currentClean.includes(savedClean) || savedClean.includes(currentClean)) return true;
    
    const currentParts = currentClean.split('.');
    const savedParts = savedClean.split('.');
    
    if (currentParts.length >= 2 && savedParts.length >= 2) {
        const currentMain = currentParts.slice(-2).join('.');
        const savedMain = savedParts.slice(-2).join('.');
        if (currentMain === savedMain) return true;
    }
    
    return false;
}

// =====================================
// Content Script Injection
// =====================================
async function injectContentScript(tabId, url) {
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
        url.startsWith('about:') || url.startsWith('moz-extension://') || url.startsWith('edge://')) {
        return;
    }
    
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/content.js']
        });
    } catch (error) {
        // Script might already be injected
    }
}

// =====================================
// Auto-fill Functionality
// =====================================
async function fillPassword(data, tabId) {
    if (!tabId) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = tab?.id;
    }
    
    if (!tabId) return;
    
    try {
        await chrome.tabs.sendMessage(tabId, {
            type: 'FILL_CREDENTIALS',
            credentials: data
        });
    } catch (error) {
        // Fallback: direct injection
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (username, password) => {
                const usernameField = document.querySelector(
                    'input[type="email"], input[type="text"][name*="user"], input[name*="email"], input[autocomplete="username"], input[name="username"], input[name="login"]'
                );
                const passwordField = document.querySelector('input[type="password"]');
                
                if (usernameField) {
                    usernameField.value = username;
                    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (passwordField) {
                    passwordField.value = password;
                    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                }
            },
            args: [data.username, data.password]
        });
    }
}

function handleLoginFormDetected(hostname, tabId) {
    if (tabId) {
        chrome.action.setBadgeText({ text: '•', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#7c3aed', tabId });
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '', tabId });
        }, 3000);
    }
}

// =====================================
// Auto-lock Functionality
// =====================================
function resetLockTimer() {
    if (lockTimer) clearTimeout(lockTimer);
    
    lockTimer = setTimeout(async () => {
        await chrome.storage.local.remove('authToken');
        console.log('Session locked due to inactivity');
    }, LOCK_TIMEOUT);
}

// =====================================
// Auto-Save Functionality
// =====================================
let autoSavePromptTabId = null;
let pendingAutoSaveCredentials = null;

async function showAutoSavePrompt(credentials, tabId) {
    // Get user settings for auto-save
    const settings = await chrome.storage.local.get('autoSaveEnabled');
    const autoSaveEnabled = settings.autoSaveEnabled !== false; // default true
    
    if (!autoSaveEnabled) {
        return { save: false };
    }
    
    autoSavePromptTabId = tabId;
    pendingAutoSaveCredentials = credentials;
    
    // Create and show notification/prompt
    return new Promise((resolve) => {
        // Show a notification with save/dismiss options
        chrome.notifications.create(`autosave-${Date.now()}`, {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '💾 Save Password?',
            message: `Save credentials for ${credentials.website}?`,
            buttons: [
                { title: '✓ Save' },
                { title: '✕ Don\'t Save' }
            ],
            isClickable: true
        }, (notificationId) => {
            // Handle button clicks
            chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
                if (id === notificationId) {
                    chrome.notifications.clear(notificationId);
                    resolve({ save: buttonIndex === 0 });
                    autoSavePromptTabId = null;
                    pendingAutoSaveCredentials = null;
                }
            });
            
            // Auto-dismiss after 15 seconds
            setTimeout(() => {
                chrome.notifications.clear(notificationId);
                resolve({ save: false });
                autoSavePromptTabId = null;
                pendingAutoSaveCredentials = null;
            }, 15000);
        });
    });
}

async function autoSaveCredentials(credentials) {
    try {
        const { authToken } = await chrome.storage.local.get('authToken');
        
        if (!authToken) {
            return { success: false, error: 'Not authenticated' };
        }
        
        // Check if password already exists
        const checkResponse = await fetch(`${API_BASE}/passwords/autosave/check`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                website: credentials.website,
                username: credentials.username
            })
        });
        
        if (!checkResponse.ok) {
            throw new Error('Failed to check for existing password');
        }
        
        const checkData = await checkResponse.json();
        
        if (checkData.exists) {
            return { 
                success: false, 
                error: 'Password already saved',
                duplicate: true 
            };
        }
        
        // Auto-detect category based on website
        const category = detectCategory(credentials.website);
        
        // Save the password
        const saveResponse = await fetch(`${API_BASE}/passwords/autosave/detect`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                website: credentials.website,
                url: credentials.url,
                username: credentials.username,
                password: credentials.password,
                category: category,
                notes: `Auto-saved on ${new Date().toLocaleDateString()}`
            })
        });
        
        if (!saveResponse.ok) {
            throw new Error('Failed to save password');
        }
        
        const data = await saveResponse.json();
        console.log('✅ Credentials auto-saved:', credentials.website);
        
        return { success: true, message: 'Credentials saved' };
    } catch (error) {
        console.error('Error auto-saving credentials:', error);
        return { success: false, error: error.message };
    }
}

// NEW: Save credentials immediately without prompting
async function saveCredentialsImmediately(credentials) {
    console.log('🔐 PASSWORD MANAGER Background: Attempting to save credentials for', credentials.website);
    
    try {
        const { authToken } = await chrome.storage.local.get('authToken');
        
        if (!authToken) {
            console.log('🔐 PASSWORD MANAGER: Not authenticated, storing for later');
            // Store credentials for when user logs in
            await chrome.storage.local.set({ 
                pendingCredentials: credentials,
                pendingCredentialsTimestamp: Date.now()
            });
            return { success: false, error: 'Not authenticated', pending: true };
        }
        
        // Check if password already exists
        try {
            const checkResponse = await fetch(`${API_BASE}/passwords/autosave/check`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    website: credentials.website,
                    username: credentials.username
                })
            });
            
            if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                if (checkData.exists) {
                    console.log('🔐 PASSWORD MANAGER: Password already exists for', credentials.website);
                    return { success: false, duplicate: true, message: 'Password already saved' };
                }
            }
        } catch (checkError) {
            console.log('🔐 PASSWORD MANAGER: Check failed, will try to save anyway');
        }
        
        // Auto-detect category
        const category = detectCategory(credentials.website);
        
        // Save the password directly
        const saveResponse = await fetch(`${API_BASE}/passwords`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                website: credentials.website,
                url: credentials.url || '',
                username: credentials.username,
                password: credentials.password,
                category: category,
                notes: `Auto-saved on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`
            })
        });
        
        if (!saveResponse.ok) {
            const errorData = await saveResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to save password');
        }
        
        const data = await saveResponse.json();
        console.log('✅ PASSWORD MANAGER: Password saved successfully for', credentials.website);
        
        // Show notification
        chrome.notifications.create(`saved-${Date.now()}`, {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '✅ Password Saved!',
            message: `Credentials for ${credentials.website} have been saved.`,
            priority: 2
        });
        
        // Clear any pending credentials
        await chrome.storage.local.remove(['pendingCredentials', 'pendingCredentialsTimestamp']);
        
        return { success: true, message: 'Password saved!', id: data.id };
        
    } catch (error) {
        console.error('🔐 PASSWORD MANAGER: Error saving credentials:', error);
        return { success: false, error: error.message };
    }
}

function detectCategory(website) {
    const categories = {
        'Social Media': ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'reddit', 'snapchat', 'youtube', 'pinterest'],
        'Email': ['gmail', 'outlook', 'yahoo', 'protonmail', 'mail'],
        'Banking': ['bank', 'paypal', 'stripe', 'square', 'wise', 'revolut', 'crypto'],
        'Shopping': ['amazon', 'ebay', 'etsy', 'shopify', 'target', 'walmart', 'aliexpress'],
        'Work': ['github', 'gitlab', 'bitbucket', 'jira', 'slack', 'asana', 'trello', 'notion'],
        'Entertainment': ['netflix', 'hulu', 'spotify', 'twitch', 'discord', 'steam', 'epicgames']
    };
    
    const siteLower = website.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => siteLower.includes(keyword))) {
            return category;
        }
    }
    
    return 'General';
}

// =====================================
// Context Menus
// =====================================
function createContextMenus() {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'pm-autofill',
            title: '🔐 PASSWORD MANAGER Auto-fill',
            contexts: ['editable']
        });
        chrome.contextMenus.create({
            id: 'pm-generate',
            title: '🎲 Generate Password',
            contexts: ['editable']
        });
        chrome.contextMenus.create({
            id: 'pm-open',
            title: '🔐 Open PASSWORD MANAGER',
            contexts: ['all']
        });
    });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
        case 'pm-autofill':
            chrome.tabs.sendMessage(tab.id, { type: 'SHOW_AUTOFILL_POPUP' });
            break;
            
        case 'pm-generate':
            const password = generateRandomPassword(16);
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (pwd) => {
                    const activeElement = document.activeElement;
                    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                        activeElement.value = pwd;
                        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                },
                args: [password]
            });
            break;
            
        case 'pm-open':
            chrome.action.openPopup();
            break;
    }
});

// =====================================
// Utility Functions
// =====================================
async function getCurrentTabUrl() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab?.url || '';
    } catch (error) {
        return '';
    }
}

async function getCurrentTabInfo() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return { hostname: '', title: '' };
        
        const url = new URL(tab.url);
        return {
            hostname: url.hostname,
            title: tab.title || url.hostname,
            url: tab.url
        };
    } catch (error) {
        return { hostname: '', title: '' };
    }
}

function generateRandomPassword(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
        password += chars[array[i] % chars.length];
    }
    
    return password;
}

console.log('PASSWORD MANAGER background service started');



