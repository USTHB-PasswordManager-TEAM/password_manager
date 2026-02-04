/**
 * PASSWORD MANAGER - Popup Script
 * Handles all UI interactions and API communication
 */

// =====================================
// Configuration
// =====================================
const API_BASE = 'http://localhost:5000/api';
let authToken = null;
let currentPasswords = [];
let currentCategory = 'all';
let editMode = false;

// =====================================
// DOM Elements
// =====================================
const elements = {
    // Screens
    setupScreen: document.getElementById('setup-screen'),
    loginScreen: document.getElementById('login-screen'),
    mainScreen: document.getElementById('main-screen'),
    
    // Connection Status
    connectionStatus: document.getElementById('connection-status'),
    statusText: document.querySelector('.status-text'),
    
    // Setup
    setupPassword: document.getElementById('setup-password'),
    setupConfirm: document.getElementById('setup-confirm'),
    setupBtn: document.getElementById('setup-btn'),
    setupStrength: document.getElementById('setup-strength'),
    
    // Login
    loginPassword: document.getElementById('login-password'),
    loginBtn: document.getElementById('login-btn'),
    loginError: document.getElementById('login-error'),
    
    // Header
    themeToggle: document.getElementById('theme-toggle'),
    settingsBtn: document.getElementById('settings-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Current Site
    currentSiteBanner: document.getElementById('current-site-banner'),
    currentSiteName: document.getElementById('current-site-name'),
    currentSiteMatch: document.getElementById('current-site-match'),
    autofillBtn: document.getElementById('autofill-btn'),
    
    // Main Screen
    searchInput: document.getElementById('search-input'),
    addBtn: document.getElementById('add-btn'),
    addFirstBtn: document.getElementById('add-first-btn'),
    generateBtn: document.getElementById('generate-btn'),
    passwordList: document.getElementById('password-list'),
    emptyState: document.getElementById('empty-state'),
    totalCount: document.getElementById('total-count'),
    categoryList: document.getElementById('category-list'),
    
    // Modal
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalClose: document.getElementById('modal-close'),
    modalCancel: document.getElementById('modal-cancel'),
    modalSave: document.getElementById('modal-save'),
    editId: document.getElementById('edit-id'),
    inputWebsite: document.getElementById('input-website'),
    inputUrl: document.getElementById('input-url'),
    inputUsername: document.getElementById('input-username'),
    inputPassword: document.getElementById('input-password'),
    inputCategory: document.getElementById('input-category'),
    inputNotes: document.getElementById('input-notes'),
    togglePassword: document.getElementById('toggle-password'),
    generatePassword: document.getElementById('generate-password'),
    passwordStrength: document.getElementById('password-strength'),
    
    // Generator Modal
    generatorModal: document.getElementById('generator-modal'),
    generatorClose: document.getElementById('generator-close'),
    generatedPassword: document.getElementById('generated-password'),
    generatedStrength: document.getElementById('generated-strength'),
    copyGenerated: document.getElementById('copy-generated'),
    regenerate: document.getElementById('regenerate'),
    useGenerated: document.getElementById('use-generated'),
    genLength: document.getElementById('gen-length'),
    lengthValue: document.getElementById('length-value'),
    genLowercase: document.getElementById('gen-lowercase'),
    genUppercase: document.getElementById('gen-uppercase'),
    genDigits: document.getElementById('gen-digits'),
    genSpecial: document.getElementById('gen-special'),
    genAmbiguous: document.getElementById('gen-ambiguous'),
    
    // Settings Modal
    settingsModal: document.getElementById('settings-modal'),
    settingsClose: document.getElementById('settings-close'),
    settingsSave: document.getElementById('settings-save'),
    settingAutolock: document.getElementById('setting-autolock'),
    settingAutosave: document.getElementById('setting-autosave'),
    settingAutofill: document.getElementById('setting-autofill'),
    settingTheme: document.getElementById('setting-theme'),
    settingNotifications: document.getElementById('setting-notifications'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    importFile: document.getElementById('import-file'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// Current site data
let currentSiteInfo = null;
let matchingPasswordsForSite = [];

// =====================================
// API Functions
// =====================================
async function apiRequest(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// =====================================
// Initialization
// =====================================
async function init() {
    try {
        // Load saved theme and token from chrome.storage
        const stored = await chrome.storage.local.get(['theme', 'authToken']);
        const savedTheme = stored.theme || 'dark';
        setTheme(savedTheme);
        
        // Load saved token from chrome.storage (shared with background script)
        authToken = stored.authToken || null;
        console.log('🔐 PASSWORD MANAGER: Initialized, token:', authToken ? 'present' : 'none');
        
        // Check connection and auth status
        await checkConnection();
        
        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('🔐 PASSWORD MANAGER: Init error:', error);
        // Fallback - try to continue
        setupEventListeners();
        showScreen('login');
    }
}

async function checkConnection() {
    try {
        const healthCheck = await fetch(`${API_BASE}/health`);
        if (healthCheck.ok) {
            updateConnectionStatus('connected', 'Connected to server');
            await checkAuthStatus();
        } else {
            throw new Error('Server not responding');
        }
    } catch (error) {
        updateConnectionStatus('error', 'Server offline - Start backend');
        showScreen('login');
    }
}

async function checkAuthStatus() {
    try {
        const status = await apiRequest('/auth/status');
        
        if (!status.master_exists) {
            showScreen('setup');
        } else if (authToken) {
            // Verify token
            try {
                await apiRequest('/auth/verify');
                showScreen('main');
                loadPasswords();
                detectCurrentSite();
            } catch {
                authToken = null;
                await chrome.storage.local.remove('authToken');
                showScreen('login');
            }
        } else {
            showScreen('login');
        }
    } catch (error) {
        showScreen('login');
    }
}

// =====================================
// Screen Management
// =====================================
function showScreen(screen) {
    elements.setupScreen.classList.add('hidden');
    elements.loginScreen.classList.add('hidden');
    elements.mainScreen.classList.add('hidden');
    elements.logoutBtn.classList.add('hidden');
    
    switch (screen) {
        case 'setup':
            elements.setupScreen.classList.remove('hidden');
            break;
        case 'login':
            elements.loginScreen.classList.remove('hidden');
            elements.loginPassword.value = '';
            elements.loginError.classList.add('hidden');
            break;
        case 'main':
            elements.mainScreen.classList.remove('hidden');
            elements.logoutBtn.classList.remove('hidden');
            break;
    }
}

// =====================================
// Current Site Detection & Auto-fill
// =====================================
async function detectCurrentSite() {
    try {
        // Get current tab info
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB_INFO' }, resolve);
        });
        
        if (response && response.hostname) {
            currentSiteInfo = response;
            elements.currentSiteBanner.classList.remove('hidden');
            elements.currentSiteName.textContent = response.hostname;
            
            // Search for matching passwords
            await findMatchingPasswords(response.hostname);
        } else {
            elements.currentSiteBanner.classList.add('hidden');
        }
    } catch (error) {
        console.error('Failed to detect current site:', error);
        elements.currentSiteBanner.classList.add('hidden');
    }
}

async function findMatchingPasswords(hostname) {
    try {
        const result = await apiRequest(`/passwords?search=${encodeURIComponent(hostname)}`);
        
        // Filter for better matches
        matchingPasswordsForSite = result.passwords.filter(pwd => {
            const pwdHost = extractHostname(pwd.url || pwd.website);
            return hostnameMatches(hostname, pwdHost) ||
                   pwd.website.toLowerCase().includes(hostname.toLowerCase()) ||
                   hostname.toLowerCase().includes(pwd.website.toLowerCase());
        });
        
        updateCurrentSiteBanner();
    } catch (error) {
        console.error('Failed to find matching passwords:', error);
        matchingPasswordsForSite = [];
        updateCurrentSiteBanner();
    }
}

function extractHostname(urlOrName) {
    try {
        if (urlOrName && urlOrName.startsWith('http')) {
            return new URL(urlOrName).hostname;
        }
        return (urlOrName || '').toLowerCase().replace(/\s+/g, '');
    } catch {
        return (urlOrName || '').toLowerCase().replace(/\s+/g, '');
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
    
    // Check main domain (e.g., google.com matches accounts.google.com)
    const currentParts = currentClean.split('.');
    const savedParts = savedClean.split('.');
    
    if (currentParts.length >= 2 && savedParts.length >= 2) {
        const currentMain = currentParts.slice(-2).join('.');
        const savedMain = savedParts.slice(-2).join('.');
        if (currentMain === savedMain) return true;
    }
    
    return false;
}

function updateCurrentSiteBanner() {
    if (matchingPasswordsForSite.length > 0) {
        elements.currentSiteBanner.classList.add('has-match');
        elements.currentSiteMatch.textContent = `${matchingPasswordsForSite.length} password${matchingPasswordsForSite.length > 1 ? 's' : ''} found`;
        elements.currentSiteMatch.classList.add('found');
        elements.autofillBtn.disabled = false;
        
        // If only one match, show username
        if (matchingPasswordsForSite.length === 1) {
            elements.currentSiteMatch.textContent = matchingPasswordsForSite[0].username;
        }
    } else {
        elements.currentSiteBanner.classList.remove('has-match');
        elements.currentSiteMatch.textContent = 'No saved passwords';
        elements.currentSiteMatch.classList.remove('found');
        elements.autofillBtn.disabled = true;
    }
}

async function handleAutofill() {
    if (matchingPasswordsForSite.length === 0) {
        showToast('No passwords found for this site', 'error');
        return;
    }
    
    let selectedPassword;
    
    if (matchingPasswordsForSite.length === 1) {
        // Auto-fill with the only match
        selectedPassword = matchingPasswordsForSite[0];
    } else {
        // Show selection modal
        selectedPassword = await showPasswordSelectionModal();
        if (!selectedPassword) return;
    }
    
    // Send fill command to content script
    try {
        chrome.runtime.sendMessage({
            type: 'FILL_PASSWORD',
            data: {
                username: selectedPassword.username,
                password: selectedPassword.password
            }
        });
        showToast('✅ Credentials filled!', 'success');
        
        // Close popup after short delay
        setTimeout(() => window.close(), 500);
    } catch (error) {
        showToast('Failed to auto-fill', 'error');
    }
}

function showPasswordSelectionModal() {
    return new Promise((resolve) => {
        // Create selection modal
        const modalHtml = `
            <div id="password-select-modal" class="modal">
                <div class="modal-content" style="max-width: 320px;">
                    <div class="modal-header">
                        <h3>Select Account</h3>
                        <button id="select-modal-close" class="icon-btn">✕</button>
                    </div>
                    <div class="modal-body" style="padding: 8px;">
                        ${matchingPasswordsForSite.map((pwd, i) => `
                            <div class="password-select-item" data-index="${i}" style="
                                display: flex;
                                align-items: center;
                                gap: 12px;
                                padding: 12px;
                                cursor: pointer;
                                border-radius: 8px;
                                transition: background 0.2s;
                            ">
                                <div style="font-size: 24px;">${getCategoryIcon(pwd.category)}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 500;">${escapeHtml(pwd.website)}</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(pwd.username)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('password-select-modal');
        
        // Add event listeners
        modal.querySelector('#select-modal-close').addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });
        
        modal.querySelectorAll('.password-select-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--bg-tertiary)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                modal.remove();
                resolve(matchingPasswordsForSite[index]);
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(null);
            }
        });
    });
}

// =====================================
// Event Listeners
// =====================================
function setupEventListeners() {
    // Theme Toggle
    elements.themeToggle.addEventListener('click', () => {
        const currentTheme = document.getElementById('app').classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
    
    // Auto-fill Button
    elements.autofillBtn.addEventListener('click', handleAutofill);
    
    // Setup
    elements.setupBtn.addEventListener('click', handleSetup);
    elements.setupPassword.addEventListener('input', () => {
        updateStrengthBar(elements.setupPassword.value, elements.setupStrength);
    });
    elements.setupPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.setupConfirm.focus();
    });
    elements.setupConfirm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSetup();
    });
    
    // Login
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Search
    elements.searchInput.addEventListener('input', debounce(() => {
        loadPasswords(elements.searchInput.value);
    }, 300));
    
    // Category Filter
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            loadPasswords();
        });
    });
    
    // Add Password
    elements.addBtn.addEventListener('click', () => openModal());
    elements.addFirstBtn.addEventListener('click', () => openModal());
    
    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalCancel.addEventListener('click', closeModal);
    elements.modalSave.addEventListener('click', handleSavePassword);
    elements.togglePassword.addEventListener('click', () => {
        const input = elements.inputPassword;
        input.type = input.type === 'password' ? 'text' : 'password';
        elements.togglePassword.textContent = input.type === 'password' ? '👁️' : '🙈';
    });
    elements.inputPassword.addEventListener('input', () => {
        checkPasswordStrength(elements.inputPassword.value);
    });
    elements.generatePassword.addEventListener('click', () => {
        openGeneratorModal(true);
    });
    
    // Generator Modal
    elements.generateBtn.addEventListener('click', () => openGeneratorModal(false));
    elements.generatorClose.addEventListener('click', closeGeneratorModal);
    elements.regenerate.addEventListener('click', generateNewPassword);
    elements.copyGenerated.addEventListener('click', () => {
        copyToClipboard(elements.generatedPassword.value);
    });
    elements.useGenerated.addEventListener('click', () => {
        if (editMode) {
            elements.inputPassword.value = elements.generatedPassword.value;
            checkPasswordStrength(elements.generatedPassword.value);
        } else {
            copyToClipboard(elements.generatedPassword.value);
        }
        closeGeneratorModal();
    });
    elements.genLength.addEventListener('input', () => {
        elements.lengthValue.textContent = elements.genLength.value;
        generateNewPassword();
    });
    [elements.genLowercase, elements.genUppercase, elements.genDigits, elements.genSpecial, elements.genAmbiguous].forEach(el => {
        el.addEventListener('change', generateNewPassword);
    });
    
    // Generator Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            generateNewPassword(btn.dataset.type);
        });
    });
    
    // Settings
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    elements.settingsClose.addEventListener('click', closeSettingsModal);
    elements.settingsSave.addEventListener('click', saveSettings);
    elements.exportBtn.addEventListener('click', exportPasswords);
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', handleImport);
    elements.settingTheme.addEventListener('change', (e) => {
        setTheme(e.target.value);
    });
    
    // Close modals on background click
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });
    elements.generatorModal.addEventListener('click', (e) => {
        if (e.target === elements.generatorModal) closeGeneratorModal();
    });
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeSettingsModal();
    });
}

// =====================================
// Auth Handlers
// =====================================
async function handleSetup() {
    const password = elements.setupPassword.value;
    const confirm = elements.setupConfirm.value;
    
    if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    if (password !== confirm) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    try {
        const result = await apiRequest('/auth/setup', 'POST', { password });
        authToken = result.token;
        await chrome.storage.local.set({ authToken: authToken });
        showToast('Master password created!', 'success');
        showScreen('main');
        loadPasswords();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleLogin() {
    const password = elements.loginPassword.value;
    
    if (!password) {
        showError('Please enter your password');
        return;
    }
    
    try {
        const result = await apiRequest('/auth/login', 'POST', { password });
        authToken = result.token;
        await chrome.storage.local.set({ authToken: authToken });
        showScreen('main');
        loadPasswords();
    } catch (error) {
        showError('Invalid password');
    }
}

async function handleLogout() {
    try {
        await apiRequest('/auth/logout', 'POST');
    } catch {}
    
    authToken = null;
    await chrome.storage.local.remove('authToken');
    showScreen('login');
}

function showError(message) {
    elements.loginError.textContent = message;
    elements.loginError.classList.remove('hidden');
}

// =====================================
// Password Management
// =====================================
async function loadPasswords(search = '') {
    try {
        let endpoint = '/passwords';
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (currentCategory === 'favorites') params.append('favorites', 'true');
        else if (currentCategory !== 'all') params.append('category', currentCategory);
        
        if (params.toString()) endpoint += `?${params.toString()}`;
        
        // Show loading state
        elements.passwordList.innerHTML = '<div style="text-align: center; padding: 40px; color: #a0a0a0;">⏳ Loading passwords...</div>';
        elements.emptyState.classList.add('hidden');
        elements.passwordList.classList.remove('hidden');
        
        console.log('🔐 PASSWORD MANAGER: Loading passwords from', endpoint);
        const result = await apiRequest(endpoint);
        console.log('🔐 PASSWORD MANAGER: Got result:', result);
        
        currentPasswords = result.passwords || [];
        renderPasswords();
        updateStats(result.count || 0);
        console.log('🔐 PASSWORD MANAGER: Render complete, count:', currentPasswords.length);
    } catch (error) {
        console.error('🔐 PASSWORD MANAGER: Load error:', error);
        elements.passwordList.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">❌ Failed to load passwords</div>';
        showToast('Failed to load passwords', 'error');
    }
}

function renderPasswords() {
    console.log('🔐 PASSWORD MANAGER: Rendering', currentPasswords.length, 'passwords');
    
    if (!elements.passwordList || !elements.emptyState) {
        console.error('🔐 PASSWORD MANAGER: DOM elements not found!');
        return;
    }
    
    elements.passwordList.innerHTML = '';
    
    if (!currentPasswords || currentPasswords.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.passwordList.classList.add('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.passwordList.classList.remove('hidden');
    
    currentPasswords.forEach(pwd => {
        try {
            const item = document.createElement('div');
            item.className = 'password-item';
            item.innerHTML = `
                <div class="password-icon">${getCategoryIcon(pwd.category)}</div>
                <div class="password-info">
                    <div class="password-website">${escapeHtml(pwd.website || '')}</div>
                    <div class="password-username">${escapeHtml(pwd.username || '')}</div>
                </div>
                <div class="password-actions">
                    <button class="icon-btn fill-btn" title="Auto-fill on page">🔑</button>
                    <button class="icon-btn favorite-btn ${pwd.favorite ? 'active' : ''}" data-id="${pwd.id}" title="Favorite">⭐</button>
                    <button class="icon-btn copy-btn" data-password="${escapeHtml(pwd.password || '')}" title="Copy Password">📋</button>
                    <button class="icon-btn edit-btn" data-id="${pwd.id}" title="Edit">✏️</button>
                    <button class="icon-btn delete-btn" data-id="${pwd.id}" title="Delete">🗑️</button>
                </div>
            `;
            
            // Event listeners for actions
            item.querySelector('.fill-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                fillPasswordOnPage(pwd);
            });
            
            item.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(pwd.id);
            });
            
            item.querySelector('.copy-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(pwd.password);
            });
            
            item.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(pwd);
            });
            
            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deletePassword(pwd.id, pwd.website);
            });
            
            elements.passwordList.appendChild(item);
        } catch (err) {
            console.error('🔐 PASSWORD MANAGER: Error rendering password:', err, pwd);
        }
    });
    
    console.log('🔐 PASSWORD MANAGER: Render complete');
}

async function fillPasswordOnPage(pwd) {
    try {
        chrome.runtime.sendMessage({
            type: 'FILL_PASSWORD',
            data: {
                username: pwd.username,
                password: pwd.password
            }
        });
        showToast('✅ Credentials filled!', 'success');
        setTimeout(() => window.close(), 500);
    } catch (error) {
        showToast('Failed to auto-fill', 'error');
    }
}

async function handleSavePassword() {
    const data = {
        website: elements.inputWebsite.value.trim(),
        url: elements.inputUrl.value.trim(),
        username: elements.inputUsername.value.trim(),
        password: elements.inputPassword.value,
        category: elements.inputCategory.value,
        notes: elements.inputNotes.value.trim()
    };
    
    if (!data.website || !data.username || !data.password) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    try {
        const id = elements.editId.value;
        if (id) {
            await apiRequest(`/passwords/${id}`, 'PUT', data);
            showToast('Password updated!', 'success');
        } else {
            await apiRequest('/passwords', 'POST', data);
            showToast('Password added!', 'success');
        }
        closeModal();
        loadPasswords();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deletePassword(id, website) {
    if (!confirm(`Delete password for "${website}"?`)) return;
    
    try {
        await apiRequest(`/passwords/${id}`, 'DELETE');
        showToast('Password deleted', 'success');
        loadPasswords();
    } catch (error) {
        showToast('Failed to delete', 'error');
    }
}

async function toggleFavorite(id) {
    try {
        await apiRequest(`/passwords/${id}/favorite`, 'POST');
        loadPasswords();
    } catch (error) {
        showToast('Failed to update favorite', 'error');
    }
}

// =====================================
// Modal Functions
// =====================================
function openModal(password = null) {
    editMode = true;
    elements.modal.classList.remove('hidden');
    
    if (password) {
        elements.modalTitle.textContent = 'Edit Password';
        elements.editId.value = password.id;
        elements.inputWebsite.value = password.website;
        elements.inputUrl.value = password.url || '';
        elements.inputUsername.value = password.username;
        elements.inputPassword.value = password.password;
        elements.inputCategory.value = password.category;
        elements.inputNotes.value = password.notes || '';
        checkPasswordStrength(password.password);
    } else {
        elements.modalTitle.textContent = 'Add Password';
        elements.editId.value = '';
        elements.inputWebsite.value = '';
        elements.inputUrl.value = '';
        elements.inputUsername.value = '';
        elements.inputPassword.value = '';
        elements.inputCategory.value = 'General';
        elements.inputNotes.value = '';
        elements.passwordStrength.textContent = '';
    }
    
    elements.inputWebsite.focus();
}

function closeModal() {
    elements.modal.classList.add('hidden');
    editMode = false;
}

function openGeneratorModal(fromModal = false) {
    elements.generatorModal.classList.remove('hidden');
    elements.useGenerated.textContent = fromModal ? 'Use This Password' : 'Copy to Clipboard';
    generateNewPassword();
}

function closeGeneratorModal() {
    elements.generatorModal.classList.add('hidden');
}

// =====================================
// Settings Modal
// =====================================
async function openSettingsModal() {
    // Load current settings
    const stored = await chrome.storage.local.get([
        'autolock', 'autosave', 'autofill', 'theme', 'notifications'
    ]);
    
    elements.settingAutolock.value = stored.autolock || '5';
    elements.settingAutosave.checked = stored.autosave !== false;
    elements.settingAutofill.checked = stored.autofill !== false;
    elements.settingTheme.value = stored.theme || 'dark';
    elements.settingNotifications.checked = stored.notifications !== false;
    
    elements.settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    elements.settingsModal.classList.add('hidden');
}

async function saveSettings() {
    const settings = {
        autolock: elements.settingAutolock.value,
        autosave: elements.settingAutosave.checked,
        autofill: elements.settingAutofill.checked,
        theme: elements.settingTheme.value,
        notifications: elements.settingNotifications.checked
    };
    
    await chrome.storage.local.set(settings);
    setTheme(settings.theme);
    showToast('Settings saved!', 'success');
    closeSettingsModal();
}

async function exportPasswords() {
    try {
        const result = await apiRequest('/export');
        const dataStr = JSON.stringify(result, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `proone-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Passwords exported!', 'success');
    } catch (error) {
        showToast('Export failed: ' + error.message, 'error');
    }
}

async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.passwords || !Array.isArray(data.passwords)) {
            throw new Error('Invalid backup file');
        }
        
        const result = await apiRequest('/import', 'POST', { passwords: data.passwords });
        showToast(`Imported ${result.imported} passwords!`, 'success');
        loadPasswords();
    } catch (error) {
        showToast('Import failed: ' + error.message, 'error');
    }
    
    // Reset file input
    e.target.value = '';
}

// =====================================
// Password Generator
// =====================================
async function generateNewPassword(type = 'random') {
    const activeTab = document.querySelector('.tab-btn.active');
    const genType = type || activeTab?.dataset.type || 'random';
    
    let endpoint, data;
    
    switch (genType) {
        case 'memorable':
            endpoint = '/generate/memorable';
            data = { word_count: 4 };
            break;
        case 'pin':
            endpoint = '/generate/pin';
            data = { length: parseInt(elements.genLength.value) };
            break;
        default:
            endpoint = '/generate';
            data = {
                length: parseInt(elements.genLength.value),
                lowercase: elements.genLowercase.checked,
                uppercase: elements.genUppercase.checked,
                digits: elements.genDigits.checked,
                special: elements.genSpecial.checked,
                exclude_ambiguous: elements.genAmbiguous.checked
            };
    }
    
    try {
        const result = await apiRequest(endpoint, 'POST', data);
        elements.generatedPassword.value = result.password || result.pin;
        updateGeneratedStrength(result.strength);
    } catch (error) {
        // Fallback to local generation
        elements.generatedPassword.value = generateLocalPassword();
    }
}

function generateLocalPassword() {
    const length = parseInt(elements.genLength.value);
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function checkPasswordStrength(password) {
    if (!password) {
        elements.passwordStrength.textContent = '';
        return;
    }
    
    try {
        const result = await apiRequest('/check-strength', 'POST', { password });
        elements.passwordStrength.textContent = `${result.strength} (${result.score}/100)`;
        elements.passwordStrength.style.color = result.color;
    } catch {
        elements.passwordStrength.textContent = '';
    }
}

function updateGeneratedStrength(strength) {
    if (!strength) return;
    
    const bar = elements.generatedStrength;
    bar.className = 'strength-bar-full';
    
    if (strength.score >= 80) bar.classList.add('very-strong');
    else if (strength.score >= 60) bar.classList.add('strong');
    else if (strength.score >= 40) bar.classList.add('medium');
    else bar.classList.add('weak');
}

function updateStrengthBar(password, element) {
    element.className = 'strength-bar';
    
    if (!password) return;
    
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 25;
    if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 25;
    
    if (score >= 100) element.classList.add('very-strong');
    else if (score >= 75) element.classList.add('strong');
    else if (score >= 50) element.classList.add('medium');
    else element.classList.add('weak');
}

// =====================================
// Utility Functions
// =====================================
function setTheme(theme) {
    const app = document.getElementById('app');
    app.classList.remove('dark-theme', 'light-theme');
    app.classList.add(`${theme}-theme`);
    elements.themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    chrome.storage.local.set({ theme: theme });
}

function updateConnectionStatus(status, message) {
    elements.connectionStatus.className = `status-bar ${status}`;
    elements.statusText.textContent = message;
}

function updateStats(count) {
    elements.totalCount.textContent = `${count} password${count !== 1 ? 's' : ''}`;
}

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
    return icons[category] || '📁';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function showToast(message, type = '') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    
    setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =====================================
// Start Application
// =====================================
document.addEventListener('DOMContentLoaded', init);

