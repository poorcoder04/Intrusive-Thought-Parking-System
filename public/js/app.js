const API_URL = `${window.location.origin}/api`;

// State Management
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  activeTab: 'login',
  currentView: 'landing'  // 'landing' | 'auth' | 'dashboard'
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  setupEventHandlers();
  initCustomDatePicker();   // set min date on the custom date input
  checkAuthStatus();
});

function setupEventHandlers() {
  document.getElementById('tab-login').addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchAuthTab('register'));
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('park-form').addEventListener('submit', handleParkThought);
}

// Set the minimum selectable date to today so users can't pick the past
function initCustomDatePicker() {
  const input = document.getElementById('thought-custom-date');
  if (!input) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm   = String(today.getMonth() + 1).padStart(2, '0');
  const dd   = String(today.getDate()).padStart(2, '0');
  input.min = `${yyyy}-${mm}-${dd}`;
}

// Show/hide the custom date input based on the dropdown selection
function handleDateOptionChange(value) {
  const wrapper = document.getElementById('custom-date-wrapper');
  const customInput = document.getElementById('thought-custom-date');
  if (value === 'custom') {
    wrapper.classList.remove('hidden');
    customInput.required = true;
  } else {
    wrapper.classList.add('hidden');
    customInput.required = false;
    customInput.value = '';
  }
}

// Landing Page Navigation
function showLandingView() {
  if (state.token && state.user) return;
  document.getElementById('landing-view').classList.remove('hidden');
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('nav-landing-links').classList.remove('hidden');
  document.getElementById('nav-landing-links').classList.add('md:flex');
  state.currentView = 'landing';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAuthView(startTab = 'register') {
  document.getElementById('landing-view').classList.add('hidden');
  document.getElementById('auth-view').classList.remove('hidden');
  document.getElementById('nav-landing-links').classList.add('hidden');
  state.currentView = 'auth';
  switchAuthTab(startTab);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function scrollToHowItWorks() { scrollToSection('how-it-works-section'); }
function scrollToGuide()       { scrollToSection('user-guide-section'); }
function scrollToAuth()        { scrollToSection('auth-anchor'); }

// API Helper
async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

// Auth Handlers
async function handleLogin(event) {
  event.preventDefault();
  const btn = event.target.querySelector('button[type="submit"]');
  setButtonLoading(btn, true, 'Signing in...');

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value
      })
    });
    persistSession(data);
    showAlert('Welcome back. Your thoughts are parked safely.', 'success');
    checkAuthStatus();
  } catch (error) {
    showAlert(error.message);
  } finally {
    setButtonLoading(btn, false, 'Sign In to Garage');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const btn = event.target.querySelector('button[type="submit"]');
  setButtonLoading(btn, true, 'Creating account...');

  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('reg-name').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value
      })
    });
    persistSession(data);
    showAlert('Account created. Your mental parking bay is open.', 'success');
    checkAuthStatus();
  } catch (error) {
    showAlert(error.message);
  } finally {
    setButtonLoading(btn, false, 'Create Free Account');
  }
}

// Park Thought Handler
async function handleParkThought(event) {
  event.preventDefault();
  const btn = event.target.querySelector('button[type="submit"]');
  setButtonLoading(btn, true, 'Parking...');

  try {
    const dateOption  = document.getElementById('thought-date').value;
    const timeValue   = document.getElementById('thought-time').value;  // HH:MM from native picker
    const customDate  = dateOption === 'custom'
      ? document.getElementById('thought-custom-date').value   // YYYY-MM-DD
      : undefined;

    // Send the client's timezone offset so the server computes correct UTC time.
    // getTimezoneOffset() returns minutes: positive = behind UTC, negative = ahead.
    const tzOffset = new Date().getTimezoneOffset();

    await apiRequest('/thoughts/park', {
      method: 'POST',
      body: JSON.stringify({
        content:    document.getElementById('thought-content').value.trim(),
        dateOption: dateOption,
        time:       timeValue,
        tzOffset:   tzOffset,
        customDate: customDate
      })
    });

    event.target.reset();
    // Reset the custom date wrapper after form reset
    document.getElementById('custom-date-wrapper').classList.add('hidden');
    document.getElementById('thought-custom-date').required = false;

    fetchActiveThoughts();
    openParkModal();
  } catch (error) {
    showAlert(error.message);
  } finally {
    setButtonLoading(btn, false, '<i class="fa-solid fa-parking"></i> Lock & Park Thought');
  }
}

// Modal: open after a thought is successfully parked
function openParkModal() {
  const overlay = document.getElementById('park-modal-overlay');
  const card    = document.getElementById('park-modal-card');
  overlay.classList.remove('hidden');
  // Tiny delay so the CSS transition plays from the scaled-down state
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.classList.remove('scale-90', 'opacity-0');
    card.classList.add('scale-100', 'opacity-100');
  }));
}

// Modal: close and reset transition classes so it animates correctly next time
function closeParkModal() {
  const overlay = document.getElementById('park-modal-overlay');
  const card    = document.getElementById('park-modal-card');
  card.classList.remove('scale-100', 'opacity-100');
  card.classList.add('scale-90', 'opacity-0');
  setTimeout(() => overlay.classList.add('hidden'), 280);
}

// Close modal when user presses Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeParkModal();
});

// Delete Thought
// Cancel/delete a parked thought before it fires
async function deleteThought(thoughtId) {
  if (!confirm('Cancel this parked thought? The scheduled reminder will not be sent.')) return;

  try {
    await apiRequest(`/thoughts/${thoughtId}`, { method: 'DELETE' });
    showAlert('Thought removed. One less thing to worry about.', 'success');
    fetchActiveThoughts();
  } catch (error) {
    showAlert(error.message);
  }
}

// Data Fetching
async function fetchActiveThoughts() {
  try {
    const data = await apiRequest('/thoughts/active');
    renderThoughtList('active-list', data.thoughts, 'active-count',
      'No active parked thoughts. Clear mind, clean desk.', true);
  } catch (error) {
    handleSessionError(error);
  }
}

async function fetchThoughtHistory() {
  try {
    const data = await apiRequest('/thoughts/history');
    renderThoughtList('history-list', data.history, 'history-count',
      'No released thoughts yet. The archive is waiting.', false);
  } catch (error) {
    handleSessionError(error);
  }
}

// Render Helpers
// showDelete flag controls whether the delete button renders (active only)
function renderThoughtList(listId, thoughts, countId, emptyMessage, showDelete) {
  const list = document.getElementById(listId);
  document.getElementById(countId).innerText = thoughts.length;

  if (thoughts.length === 0) {
    list.innerHTML = `<div class="text-sm text-slate-500 border border-dashed border-slate-700 rounded-xl p-4">${emptyMessage}</div>`;
    return;
  }

  list.innerHTML = thoughts.map((thought) => `
    <article class="bg-slate-950/40 border border-slate-700/70 rounded-xl p-4">
      <p class="text-sm text-slate-200 leading-relaxed">${escapeHtml(thought.content)}</p>
      <div class="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span><i class="fa-regular fa-clock mr-1"></i>${formatDateTime(thought.worryTime)}</span>
        <div class="flex items-center gap-3">
          <span class="${thought.isNotified ? 'text-emerald-400' : 'text-amber-400'}">
            ${thought.isNotified ? 'Released' : 'Parked'}
          </span>
          ${showDelete && !thought.isNotified ? `
            <button
              onclick="deleteThought('${thought._id}')"
              title="Cancel this thought"
              class="text-rose-400/70 hover:text-rose-400 transition flex items-center gap-1">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>` : ''}
        </div>
      </div>
    </article>
  `).join('');
}

function handleSessionError(error) {
  if (error.message.toLowerCase().includes('not authorized')) {
    handleLogout();
    showAlert('Session expired. Please log in again.');
    return;
  }
  showAlert(error.message);
}

function formatDateTime(value) {
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Session Persistence
function persistSession(data) {
  state.token = data.token;
  state.user  = data.user;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

// Auth Status Gatekeeper
function checkAuthStatus() {
  const landingView     = document.getElementById('landing-view');
  const authView        = document.getElementById('auth-view');
  const dashboardView   = document.getElementById('dashboard-view');
  const navControls     = document.getElementById('nav-auth-controls');
  const navLandingLinks = document.getElementById('nav-landing-links');

  if (state.token && state.user) {
    landingView.classList.add('hidden');
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    navLandingLinks.classList.add('hidden');
    setTimeout(() => dashboardView.classList.remove('opacity-0'), 50);
    state.currentView = 'dashboard';

    navControls.innerHTML = `
      <span class="text-sm text-slate-400 hidden sm:inline">Logged in as <strong class="text-slate-200">${escapeHtml(state.user.name)}</strong></span>
      <button onclick="handleLogout()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
        <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
      </button>
    `;

    fetchActiveThoughts();
    fetchThoughtHistory();
  } else {
    dashboardView.classList.add('hidden');
    dashboardView.classList.add('opacity-0');
    authView.classList.add('hidden');

    if (state.currentView !== 'auth') {
      landingView.classList.remove('hidden');
      navLandingLinks.classList.remove('hidden');
      navLandingLinks.classList.add('md:flex');
      state.currentView = 'landing';
    }

    navControls.innerHTML = `
      <button onclick="showAuthView('login')" class="text-sm text-slate-400 hover:text-slate-200 transition px-3 py-2">
        Log In
      </button>
      <button onclick="showAuthView('register')" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition flex items-center gap-2">
        <i class="fa-solid fa-rocket"></i> Get Started
      </button>
    `;
  }
}

// Tab Switcher
function switchAuthTab(tab) {
  state.activeTab = tab;
  const loginForm    = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin     = document.getElementById('tab-login');
  const tabRegister  = document.getElementById('tab-register');

  const activeClass   = (color) => `flex-1 text-center font-medium py-2.5 rounded-xl transition-all duration-300 bg-${color}-600 text-white shadow-lg`;
  const inactiveClass = 'flex-1 text-center font-medium py-2.5 rounded-xl transition-all duration-300 text-slate-400 hover:text-slate-200';

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.className    = activeClass('indigo');
    tabRegister.className = inactiveClass;
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.className    = inactiveClass;
    tabRegister.className = activeClass('emerald');
  }
}

// Logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  state.token       = null;
  state.user        = null;
  state.currentView = 'landing';
  showAlert('Session terminated successfully.', 'success');
  checkAuthStatus();
}

// Toast Alert
let alertTimer = null;

function showAlert(message, type = 'error') {
  const container = document.getElementById('alert-container');
  const box       = document.getElementById('alert-box');
  const icon      = document.getElementById('alert-icon');
  const msgEl     = document.getElementById('alert-message');

  msgEl.innerText = message;

  if (type === 'success') {
    box.className = 'p-4 rounded-xl flex items-start gap-3 shadow-2xl border bg-emerald-950/80 border-emerald-500/30 text-emerald-200';
    icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
  } else {
    box.className = 'p-4 rounded-xl flex items-start gap-3 shadow-2xl border bg-rose-950/80 border-rose-500/30 text-rose-200';
    icon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
  }

  container.classList.remove('hidden');
  setTimeout(() => container.classList.remove('translate-x-full'), 50);

  // Clear any existing auto-dismiss timer before setting a new one
  if (alertTimer) clearTimeout(alertTimer);
  alertTimer = setTimeout(dismissAlert, 4500);
}

function dismissAlert() {
  const container = document.getElementById('alert-container');
  container.classList.add('translate-x-full');
  setTimeout(() => container.classList.add('hidden'), 300);
}

// UI Utilities
function setButtonLoading(btn, loading, label) {
  if (!btn) return;
  btn.disabled   = loading;
  btn.innerHTML  = loading
    ? '<i class="fa-solid fa-spinner fa-spin mr-2"></i>' + label
    : label;
}

