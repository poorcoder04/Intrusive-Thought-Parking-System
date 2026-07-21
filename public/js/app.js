const API_URL = `${window.location.origin}/api`;

    // State Management Engine
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  activeTab: 'login',
  currentView: 'landing'  // 'landing' | 'auth' | 'dashboard'
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupEventHandlers();
  checkAuthStatus();
});

function setupEventHandlers() {
  document.getElementById('tab-login').addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchAuthTab('register'));
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('park-form').addEventListener('submit', handleParkThought);
  document.getElementById('btn-manual-test').addEventListener('click', () => {
    fetchActiveThoughts();
    fetchThoughtHistory();
    showAlert('Dashboard refreshed.', 'success');
  });
}

// ─── Landing Page Navigation ─────────────────────────────────────────────────

function showLandingView() {
  if (state.token && state.user) return; // Already logged in, stay on dashboard
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

async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}

async function handleLogin(event) {
  event.preventDefault();

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
  }
}

async function handleRegister(event) {
  event.preventDefault();

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
  }
}

async function handleParkThought(event) {
  event.preventDefault();

  try {
    await apiRequest('/thoughts/park', {
      method: 'POST',
      body: JSON.stringify({
        content: document.getElementById('thought-content').value.trim(),
        dateOption: document.getElementById('thought-date').value,
        time: document.getElementById('thought-time').value.trim()
      })
    });

    event.target.reset();
    showAlert('Thought parked. Go reclaim your focus.', 'success');
    fetchActiveThoughts();
  } catch (error) {
    showAlert(error.message);
  }
}

function persistSession(data) {
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

async function fetchActiveThoughts() {
  try {
    const data = await apiRequest('/thoughts/active');
    renderThoughtList('active-list', data.thoughts, 'active-count', 'No active parked thoughts. Clear mind, clean desk.');
  } catch (error) {
    handleSessionError(error);
  }
}

async function fetchThoughtHistory() {
  try {
    const data = await apiRequest('/thoughts/history');
    renderThoughtList('history-list', data.history, 'history-count', 'No released thoughts yet. The archive is waiting.');
  } catch (error) {
    handleSessionError(error);
  }
}

function renderThoughtList(listId, thoughts, countId, emptyMessage) {
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
        <span class="${thought.isNotified ? 'text-emerald-400' : 'text-amber-400'}">
          ${thought.isNotified ? 'Released' : 'Parked'}
        </span>
      </div>
    </article>
  `).join('');
}

function handleSessionError(error) {
  if (error.message.toLowerCase().includes('not authorized')) {
    handleLogout();
    showAlert('Please log in again.');
    return;
  }

  showAlert(error.message);
}

function formatDateTime(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Auth Status Gatekeeper
function checkAuthStatus() {
  const landingView = document.getElementById('landing-view');
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');
  const navControls = document.getElementById('nav-auth-controls');
  const navLandingLinks = document.getElementById('nav-landing-links');

  if (state.token && state.user) {
    // User is logged in: Show Dashboard
    landingView.classList.add('hidden');
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    navLandingLinks.classList.add('hidden');
    setTimeout(() => dashboardView.classList.remove('opacity-0'), 50);
    state.currentView = 'dashboard';

    navControls.innerHTML = `
      <span class="text-sm text-slate-400 hidden sm:inline">Logged in as <strong class="text-slate-200">${state.user.name}</strong></span>
      <button onclick="handleLogout()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
        <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
      </button>
    `;
    
    // Trigger initial data pipeline fetches
    fetchActiveThoughts();
    fetchThoughtHistory();
  } else {
    // User is logged out: Show Landing page
    dashboardView.classList.add('hidden');
    dashboardView.classList.add('opacity-0');
    authView.classList.add('hidden');

    // Only show landing if we're not already intentionally on auth
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

// UI Tab Switcher (Login / Register)
function switchAuthTab(tab) {
  state.activeTab = tab;
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.className = "flex-1 text-center font-medium py-2.5 rounded-xl transition-all duration-300 bg-indigo-600 text-white shadow-lg";
    tabRegister.className = "flex-1 text-center font-medium py-2.5 rounded-xl transition-all duration-300 text-slate-400 hover:text-slate-200";
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.className = "flex-1 text-center font-medium py-2.5 rounded-xl transition-all duration-300 text-slate-400 hover:text-slate-200";
    tabRegister.className = "flex-1 text-center font-medium py-2.5 rounded-xl transition-all duration-300 bg-emerald-600 text-white shadow-lg";
  }
}

// Session Termination Handler
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  state.token = null;
  state.user = null;
  state.currentView = 'landing';
  showAlert('Session terminated successfully.', 'success');
  checkAuthStatus();
}

// Toast Alert System Engine
function showAlert(message, type = 'error') {
  const container = document.getElementById('alert-container');
  const box = document.getElementById('alert-box');
  const icon = document.getElementById('alert-icon');
  const msgEl = document.getElementById('alert-message');

  msgEl.innerText = message;
  
  if (type === 'success') {
    box.className = "p-4 rounded-xl flex items-start gap-3 shadow-2xl border bg-emerald-950/80 border-emerald-500/30 text-emerald-200";
    icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
  } else {
    box.className = "p-4 rounded-xl flex items-start gap-3 shadow-2xl border bg-rose-950/80 border-rose-500/30 text-rose-200";
    icon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
  }

  container.classList.remove('hidden');
  setTimeout(() => container.classList.remove('translate-x-full'), 50);

  // Auto-dismiss after 4 seconds
  setTimeout(dismissAlert, 4000);
}

function dismissAlert() {
  const container = document.getElementById('alert-container');
  container.classList.add('translate-x-full');
  setTimeout(() => container.classList.add('hidden'), 300);
}

