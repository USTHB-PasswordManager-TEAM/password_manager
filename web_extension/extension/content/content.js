/**
 * PASSWORD MANAGER - Content Script
 * Handles auto-detection of login forms and auto-fill functionality
 */

// =====================================
// Configuration
// =====================================
const SELECTORS = {
    // Username/Email field selectors - expanded for better detection
    username: [
        'input[type="email"]',
        'input[type="tel"]',  // Phone number login (Facebook, etc.)
        'input[type="text"][name*="user"]',
        'input[type="text"][name*="login"]',
        'input[type="text"][name*="email"]',
        'input[type="text"][name*="phone"]',
        'input[type="text"][name*="account"]',
        'input[type="text"][id*="user"]',
        'input[type="text"][id*="login"]',
        'input[type="text"][id*="email"]',
        'input[type="text"][id*="phone"]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]',
        'input[autocomplete="tel"]',
        'input[name="username"]',
        'input[name="email"]',
        'input[name="login"]',
        'input[name="identifier"]',
        'input[name="session[username_or_email]"]',  // Twitter
        'input[name="loginfmt"]',  // Microsoft
        'input[id="username"]',
        'input[id="email"]',
        'input[id="login"]',
        'input[id="identifierId"]',  // Google
        'input[id="login_field"]',  // GitHub
        'input[id="ap_email"]',  // Amazon
        'input[data-testid="login-input"]',  // Various sites
        'input[placeholder*="email" i]',
        'input[placeholder*="user" i]',
        'input[placeholder*="phone" i]',
        'input[placeholder*="mobile" i]',
        'input[aria-label*="email" i]',
        'input[aria-label*="user" i]',
        'input[aria-label*="phone" i]',
        // Generic text input near password field
        'input[type="text"]'
    ],
    // Password field selectors - expanded
    password: [
        'input[type="password"]',
        'input[autocomplete="current-password"]',
        'input[autocomplete="password"]',
        'input[name="password"]',
        'input[name="pass"]',
        'input[name="passwd"]',
        'input[name="pwd"]',
        'input[name="session[password]"]',  // Twitter
        'input[id="password"]',
        'input[id="pass"]',
        'input[id="passwd"]',
        'input[id="login_password"]',  // GitHub
        'input[id="ap_password"]',  // Amazon
        'input[data-testid="password-input"]',  // Various sites
        'input[aria-label*="password" i]',
        'input[placeholder*="password" i]'
    ],
    // Login form selectors - expanded
    form: [
        'form[action*="login"]',
        'form[action*="signin"]',
        'form[action*="sign-in"]',
        'form[action*="auth"]',
        'form[action*="session"]',
        'form[id*="login"]',
        'form[id*="signin"]',
        'form[id*="sign-in"]',
        'form[class*="login"]',
        'form[class*="signin"]',
        'form[class*="sign-in"]',
        'form[data-testid*="login"]',
        'form[name="login"]',
        'form[name="signin"]',
        'form'
    ],
    // Submit button selectors
    submitButton: [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[name*="login"]',
        'button[name*="signin"]',
        'button[id*="login"]',
        'button[id*="signin"]',
        'button[class*="login"]',
        'button[class*="signin"]',
        'button[data-testid*="login"]',
        'button[aria-label*="sign in" i]',
        'button[aria-label*="log in" i]',
        'a[role="button"][href*="login"]',
        'div[role="button"][aria-label*="log in" i]'  // Facebook-style buttons
    ]
};

// =====================================
// State
// =====================================
let detectedFields = {
    username: null,
    password: null,
    form: null
};

let pmIcon = null;
let pmPopup = null;

// =====================================
// Field Detection - Improved
// =====================================
function findField(selectors, nearPasswordField = false) {
    for (const selector of selectors) {
        const fields = document.querySelectorAll(selector);
        for (const field of fields) {
            if (field && isVisible(field)) {
                // For generic text input, make sure it's near a password field
                if (selector === 'input[type="text"]' && nearPasswordField) {
                    const passwordField = document.querySelector('input[type="password"]');
                    if (passwordField && isNearby(field, passwordField)) {
                        return field;
                    }
                } else if (selector !== 'input[type="text"]') {
                    return field;
                }
            }
        }
    }
    return null;
}

// Check if two elements are nearby (same form or close in DOM)
function isNearby(elem1, elem2) {
    if (!elem1 || !elem2) return false;
    
    // Same form?
    const form1 = elem1.closest('form');
    const form2 = elem2.closest('form');
    if (form1 && form1 === form2) return true;
    
    // Check if they share a parent container
    const parent1 = elem1.parentElement?.parentElement?.parentElement;
    const parent2 = elem2.parentElement?.parentElement?.parentElement;
    if (parent1 && parent1.contains(elem2)) return true;
    if (parent2 && parent2.contains(elem1)) return true;
    
    return false;
}

function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           rect.width > 0 &&
           rect.height > 0;
}

function detectLoginForm() {
    // First, find password field (most reliable)
    detectedFields.password = findField(SELECTORS.password);
    
    // Then find username field, preferring fields near the password
    detectedFields.username = findField(SELECTORS.username, true);
    
    // Find the form containing these fields
    if (detectedFields.password) {
        detectedFields.form = detectedFields.password.closest('form');
    } else if (detectedFields.username) {
        detectedFields.form = detectedFields.username.closest('form');
    }
    
    // Debug logging
    if (detectedFields.username || detectedFields.password) {
        console.log('🔐 PASSWORD MANAGER: Detected fields:', {
            username: detectedFields.username?.name || detectedFields.username?.id || 'found',
            password: detectedFields.password?.name || detectedFields.password?.id || 'found',
            form: detectedFields.form ? 'found' : 'not found'
        });
    }
    
    return detectedFields.username || detectedFields.password;
}

// =====================================
// PASSWORD MANAGER Icon Injection
// =====================================
function createpmIcon() {
    if (pmIcon) return pmIcon;
    
    pmIcon = document.createElement('div');
    pmIcon.id = 'pm-autofill-icon';
    pmIcon.innerHTML = '🔐';
    pmIcon.style.cssText = `
        position: absolute;
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #7c3aed, #a78bfa);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        user-select: none;
    `;
    
    pmIcon.addEventListener('mouseenter', () => {
        pmIcon.style.transform = 'scale(1.1)';
        pmIcon.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.6)';
    });
    
    pmIcon.addEventListener('mouseleave', () => {
        pmIcon.style.transform = 'scale(1)';
        pmIcon.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.4)';
    });
    
    pmIcon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showpmPopup();
    });
    
    document.body.appendChild(pmIcon);
    return pmIcon;
}

function positionIcon(field) {
    if (!pmIcon || !field) return;
    
    const rect = field.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    pmIcon.style.top = `${rect.top + scrollTop + (rect.height - 24) / 2}px`;
    pmIcon.style.left = `${rect.right + scrollLeft - 30}px`;
    pmIcon.style.display = 'flex';
}

function hideIcon() {
    if (pmIcon) {
        pmIcon.style.display = 'none';
    }
}

// =====================================
// PASSWORD MANAGER Popup (Password Selection)
// =====================================
function createpmPopup() {
    if (pmPopup) {
        pmPopup.remove();
    }
    
    pmPopup = document.createElement('div');
    pmPopup.id = 'pm-autofill-popup';
    pmPopup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 320px;
        max-height: 400px;
        background: #1a1a2e;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 9999999;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    pmPopup.innerHTML = `
        <div style="padding: 16px; border-bottom: 1px solid #2a2a4a;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">🔐</span>
                    <span style="font-size: 16px; font-weight: 600; color: #eaeaea;">PASSWORD MANAGER</span>
                </div>
                <button id="pm-popup-close" style="
                    background: none;
                    border: none;
                    color: #a0a0a0;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 4px;
                ">✕</button>
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: #a0a0a0;">
                Select credentials for <strong style="color: #a78bfa;">${window.location.hostname}</strong>
            </div>
        </div>
        <div id="pm-popup-content" style="max-height: 280px; overflow-y: auto;">
            <div style="padding: 40px; text-align: center; color: #a0a0a0;">
                <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
                Loading...
            </div>
        </div>
    `;
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.id = 'pm-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999998;
    `;
    overlay.addEventListener('click', hidepmPopup);
    
    document.body.appendChild(overlay);
    document.body.appendChild(pmPopup);
    
    // Close button
    document.getElementById('pm-popup-close').addEventListener('click', hidepmPopup);
    
    return pmPopup;
}

function showpmPopup() {
    createpmPopup();
    requestPasswordsForSite();
}

function hidepmPopup() {
    const overlay = document.getElementById('pm-overlay');
    if (overlay) overlay.remove();
    if (pmPopup) {
        pmPopup.remove();
        pmPopup = null;
    }
}

function renderPasswords(passwords) {
    const content = document.getElementById('pm-popup-content');
    if (!content) return;
    
    if (passwords.length === 0) {
        content.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #a0a0a0;">
                <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
                <div style="margin-bottom: 8px;">No saved passwords for this site</div>
                <button id="pm-add-new" style="
                    margin-top: 12px;
                    padding: 8px 16px;
                    background: #7c3aed;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 13px;
                    cursor: pointer;
                ">Open PASSWORD MANAGER to add</button>
            </div>
        `;
        document.getElementById('pm-add-new')?.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
            hidepmPopup();
        });
        return;
    }
    
    content.innerHTML = passwords.map((pwd, index) => `
        <div class="pm-password-item" data-index="${index}" style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #2a2a4a;
            transition: background 0.2s;
        ">
            <div style="
                width: 36px;
                height: 36px;
                background: #2a2a4a;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            ">${getCategoryIcon(pwd.category)}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 500; color: #eaeaea; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(pwd.website)}
                </div>
                <div style="font-size: 12px; color: #a0a0a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(pwd.username)}
                </div>
            </div>
            <div style="color: #7c3aed; font-size: 18px;">→</div>
        </div>
    `).join('');
    
    // Add hover effects and click handlers
    content.querySelectorAll('.pm-password-item').forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            item.style.background = '#2a2a4a';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
        });
        item.addEventListener('click', () => {
            fillCredentials(passwords[index]);
            hidepmPopup();
        });
    });
}

// =====================================
// Auto-fill Functions
// =====================================
function fillCredentials(credentials) {
    // Re-detect fields in case DOM changed
    detectLoginForm();
    
    if (detectedFields.username) {
        fillField(detectedFields.username, credentials.username);
    }
    
    if (detectedFields.password) {
        fillField(detectedFields.password, credentials.password);
    }
    
    showNotification('✅ Credentials filled!');
}

function fillField(field, value) {
    if (!field) return;
    
    // Focus the field
    field.focus();
    
    // Clear existing value
    field.value = '';
    
    // Set new value
    field.value = value;
    
    // Trigger various events to ensure frameworks detect the change
    const events = ['input', 'change', 'keydown', 'keyup', 'keypress'];
    events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        field.dispatchEvent(event);
    });
    
    // For React and similar frameworks
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(field, value);
    
    const inputEvent = new Event('input', { bubbles: true });
    field.dispatchEvent(inputEvent);
}

// =====================================
// Communication with Extension
// =====================================
function requestPasswordsForSite() {
    const hostname = window.location.hostname;
    
    chrome.runtime.sendMessage({
        type: 'GET_PASSWORDS_FOR_SITE',
        hostname: hostname
    }, (response) => {
        if (response && response.passwords) {
            renderPasswords(response.passwords);
        } else if (response && response.error) {
            renderError(response.error);
        } else {
            renderError('Unable to connect to PASSWORD MANAGER');
        }
    });
}

function renderError(message) {
    const content = document.getElementById('pm-popup-content');
    if (!content) return;
    
    content.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #ef4444;">
            <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
            <div style="margin-bottom: 8px;">${escapeHtml(message)}</div>
            <div style="font-size: 12px; color: #a0a0a0;">Make sure the PASSWORD MANAGER server is running</div>
        </div>
    `;
}

// =====================================
// Notification
// =====================================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #7c3aed, #a78bfa);
        color: white;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 9999999;
        box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// =====================================
// Utility Functions
// =====================================
function getCategoryIcon(category) {
    const icons = {
        'General': '📁',
        'Social Media': '📱',
        'Email': '📧',
        'Banking': '🏦',
        'Shopping': '🛒',
        'Work': '💼',
        'Entertainment': '🎮',
        'Other': '📌'
    };
    return icons[category] || '🔑';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// =====================================
// Keyboard Shortcuts
// =====================================
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+L to trigger autofill
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        if (detectLoginForm()) {
            showpmPopup();
        }
    }
    
    // Escape to close popup
    if (e.key === 'Escape') {
        hidepmPopup();
    }
});

// =====================================
// Listen for messages from background
// =====================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'FILL_CREDENTIALS':
            fillCredentials(message.credentials);
            sendResponse({ success: true });
            break;
            
        case 'CHECK_LOGIN_FORM':
            const hasForm = detectLoginForm();
            sendResponse({ 
                hasForm,
                hostname: window.location.hostname 
            });
            break;
            
        case 'SHOW_AUTOFILL_POPUP':
            showpmPopup();
            sendResponse({ success: true });
            break;
    }
});

// =====================================
// Auto-Save Detection - IMPROVED VERSION
// =====================================
let capturedCredentials = {
    username: '',
    password: '',
    website: '',
    url: ''
};
let formSubmitting = false;

// Capture credentials as user types (real-time)
function setupCredentialCapture() {
    // Capture username/email as user types
    if (detectedFields.username) {
        detectedFields.username.addEventListener('input', (e) => {
            capturedCredentials.username = e.target.value;
            capturedCredentials.website = window.location.hostname;
            capturedCredentials.url = window.location.href;
        });
        // Also capture on blur (when field loses focus)
        detectedFields.username.addEventListener('blur', (e) => {
            capturedCredentials.username = e.target.value;
        });
        // Initial value if already filled
        if (detectedFields.username.value) {
            capturedCredentials.username = detectedFields.username.value;
        }
    }
    
    // Capture password as user types
    if (detectedFields.password) {
        detectedFields.password.addEventListener('input', (e) => {
            capturedCredentials.password = e.target.value;
            capturedCredentials.website = window.location.hostname;
            capturedCredentials.url = window.location.href;
        });
        detectedFields.password.addEventListener('blur', (e) => {
            capturedCredentials.password = e.target.value;
        });
        // Initial value if already filled
        if (detectedFields.password.value) {
            capturedCredentials.password = detectedFields.password.value;
        }
    }
    
    capturedCredentials.website = window.location.hostname;
    capturedCredentials.url = window.location.href;
}

// Detect form submission and save credentials BEFORE page navigates
function detectFormSubmission() {
    // Method 1: Form submit event
    if (detectedFields.form) {
        detectedFields.form.addEventListener('submit', handleFormSubmit, true);
    }
    
    // Method 2: Click on submit buttons (use expanded selector list)
    const submitSelectors = SELECTORS.submitButton.join(', ');
    const submitButtons = document.querySelectorAll(submitSelectors);
    
    submitButtons.forEach(btn => {
        btn.addEventListener('click', handleFormSubmit, true);
        btn.addEventListener('mousedown', handleFormSubmit, true);  // Catch before click
    });
    
    // Method 3: Also listen for any button near the password field
    if (detectedFields.password) {
        const form = detectedFields.password.closest('form');
        if (form) {
            const buttons = form.querySelectorAll('button, input[type="submit"], [role="button"]');
            buttons.forEach(btn => {
                btn.addEventListener('click', handleFormSubmit, true);
            });
        }
    }
    
    // Method 4: Enter key on password field
    if (detectedFields.password) {
        detectedFields.password.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleFormSubmit(e);
            }
        }, true);
    }
    
    // Method 5: Enter key on username field (some sites)
    if (detectedFields.username) {
        detectedFields.username.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleFormSubmit(e);
            }
        }, true);
    }
    
    // Method 6: Watch for navigation (beforeunload)
    window.addEventListener('beforeunload', () => {
        // Last chance to save credentials before page unloads
        if (capturedCredentials.username && capturedCredentials.password && !formSubmitting) {
            console.log('🔐 PASSWORD MANAGER: Page unloading, saving credentials');
            chrome.storage.local.set({
                pendingCredentials: {
                    ...capturedCredentials,
                    timestamp: Date.now()
                }
            });
        }
    });
}

// Handle form submission - capture and save immediately
function handleFormSubmit(e) {
    if (formSubmitting) return; // Prevent duplicate saves
    
    // Update captured credentials one last time
    if (detectedFields.username) {
        capturedCredentials.username = detectedFields.username.value;
    }
    if (detectedFields.password) {
        capturedCredentials.password = detectedFields.password.value;
    }
    
    // Validate we have both username and password
    if (!capturedCredentials.username || !capturedCredentials.password) {
        console.log('🔐 PASSWORD MANAGER: Missing username or password, not saving');
        return;
    }
    
    formSubmitting = true;
    console.log('🔐 PASSWORD MANAGER: Form submitted, saving credentials for', capturedCredentials.website);
    
    // Save credentials to storage immediately (before page navigates)
    const credentialsToSave = {
        username: capturedCredentials.username,
        password: capturedCredentials.password,
        website: capturedCredentials.website || window.location.hostname,
        url: capturedCredentials.url || window.location.href,
        timestamp: Date.now()
    };
    
    // Store in chrome.storage for persistence across page navigation
    chrome.storage.local.set({
        pendingCredentials: credentialsToSave
    }, () => {
        console.log('🔐 PASSWORD MANAGER: Credentials stored, ready to save');
        
        // Send message to background to save immediately
        chrome.runtime.sendMessage({
            type: 'SAVE_CREDENTIALS_NOW',
            credentials: credentialsToSave
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('🔐 PASSWORD MANAGER: Will save on next page load');
            } else if (response && response.success) {
                console.log('🔐 PASSWORD MANAGER: Credentials saved successfully!');
                showNotification('✅ Password saved for ' + credentialsToSave.website);
            }
        });
    });
}

// Check for pending credentials on page load (in case previous page navigated)
function checkPendingCredentials() {
    chrome.storage.local.get('pendingCredentials', (result) => {
        if (result.pendingCredentials) {
            const creds = result.pendingCredentials;
            const timeDiff = Date.now() - creds.timestamp;
            
            // Only process if less than 30 seconds old
            if (timeDiff < 30000) {
                console.log('🔐 PASSWORD MANAGER: Found pending credentials, saving now...');
                
                chrome.runtime.sendMessage({
                    type: 'SAVE_CREDENTIALS_NOW',
                    credentials: creds
                }, (response) => {
                    if (response && response.success) {
                        showNotification('✅ Password saved for ' + creds.website);
                    } else if (response && response.duplicate) {
                        console.log('🔐 PASSWORD MANAGER: Password already exists');
                    }
                    // Clear pending credentials
                    chrome.storage.local.remove('pendingCredentials');
                });
            } else {
                // Too old, clear it
                chrome.storage.local.remove('pendingCredentials');
            }
        }
    });
}

// =====================================
// Initialize
// =====================================
function init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
}

function setup() {
    // Check for pending credentials from previous page
    checkPendingCredentials();
    
    // Initial detection
    if (detectLoginForm()) {
        createpmIcon();
        setupCredentialCapture();  // Start capturing credentials as user types
        detectFormSubmission();     // Detect when form is submitted
        
        // Position icon next to password field (preferred) or username field
        const targetField = detectedFields.password || detectedFields.username;
        if (targetField) {
            positionIcon(targetField);
            
            // Re-position on scroll and resize
            window.addEventListener('scroll', () => positionIcon(targetField), { passive: true });
            window.addEventListener('resize', () => positionIcon(targetField), { passive: true });
            
            // Show icon when field is focused
            targetField.addEventListener('focus', () => positionIcon(targetField));
        }
        
        // Notify background script
        chrome.runtime.sendMessage({
            type: 'LOGIN_FORM_DETECTED',
            hostname: window.location.hostname
        });
        
        console.log('🔐 PASSWORD MANAGER: Login form detected, auto-save enabled');
    }
    
    // Watch for dynamically added forms (SPAs like Facebook, Gmail)
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                // Re-detect fields - important for SPAs
                const foundForm = detectLoginForm();
                if (foundForm) {
                    if (!pmIcon) {
                        createpmIcon();
                    }
                    setupCredentialCapture();
                    detectFormSubmission();
                    const targetField = detectedFields.password || detectedFields.username;
                    if (targetField) {
                        positionIcon(targetField);
                    }
                    console.log('🔐 PASSWORD MANAGER: Dynamic form detected');
                }
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Start
init();

console.log('🔐 PASSWORD MANAGER content script loaded');



