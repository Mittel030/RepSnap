import { auth }                    from './auth.js';
import { router }                  from './router.js';
import { store, seedIfEmpty }      from './store.js';
import { renderAuth }              from './views/auth.js';
import { renderFeed }              from './views/feed.js';
import { renderFriends }           from './views/friends.js';
import { renderGroups }            from './views/groups.js';
import { renderProfile }           from './views/profile.js';

// ── Shared helpers ───────────────────────────────────────────────────────────
export function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000)       return 'zojuist';
  if (d < 3600000)     return `${Math.floor(d/60000)}m`;
  if (d < 86400000)    return `${Math.floor(d/3600000)}u`;
  if (d < 86400000*7)  return `${Math.floor(d/86400000)}d`;
  return new Date(ts).toLocaleDateString('nl-NL', { day:'numeric', month:'short' });
}

export function avatar(user, size = 36) {
  const initials = (user?.displayName || user?.username || '?').charAt(0).toUpperCase();
  const fs = Math.floor(size * 0.37);
  if (user?.avatar) {
    return `
      <img src="${user.avatar}" alt="${user.displayName || user.username}"
        style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="avatar-fallback" style="width:${size}px;height:${size}px;font-size:${fs}px;display:none;">
        ${initials}
      </div>`;
  }
  return `<div class="avatar-fallback" style="width:${size}px;height:${size}px;font-size:${fs}px;">
    ${initials}
  </div>`;
}

export function openModal(html, onOpen) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <div class="flex justify-center pt-3 pb-1">
      <div class="w-10 h-1 rounded-full bg-[#D1D5DB]"></div>
    </div>
    ${html}`;
  overlay.classList.remove('hidden');
  overlay.classList.add('open');
  if (onOpen) onOpen(content);
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  overlay.classList.add('hidden');
}

export function showToast(msg, type = 'info') {
  document.getElementById('rs-toast')?.remove();
  const bg = { info: '#374151', success: '#166534', error: '#991B1B' }[type] || '#374151';
  const el = document.createElement('div');
  el.id = 'rs-toast';
  el.style.cssText = `
    position:fixed;bottom:88px;left:50%;transform:translateX(-50%);
    background:${bg};color:white;padding:11px 20px;border-radius:14px;
    font-size:14px;font-weight:600;font-family:Inter,sans-serif;
    white-space:nowrap;z-index:9999;animation:slideUp .25s ease;
    box-shadow:0 4px 20px rgba(0,0,0,0.2);max-width:360px;text-align:center;`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el?.remove(), 2800);
}

// ── Pending friend badge ─────────────────────────────────────────────────────
function updateFriendBadge(userId) {
  const badge = document.getElementById('friends-badge');
  if (!badge || !userId) return;
  badge.classList.toggle('hidden', store.getPendingRequests(userId).length === 0);
}

// ── Boot ─────────────────────────────────────────────────────────────────────
seedIfEmpty();

const view    = document.getElementById('view');
const header  = document.getElementById('app-header');
const navEl   = document.getElementById('bottom-nav');
const hAction = document.getElementById('header-action');

function showChrome(userId) {
  header.style.display = 'flex';
  navEl.style.display  = 'block';
  updateFriendBadge(userId);
}
function hideChrome() {
  header.style.display = 'none';
  navEl.style.display  = 'none';
}
function setNav(route) {
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.route === route));
}
function setHeaderAction(svg, onClick) {
  hAction.innerHTML = svg || '';
  hAction.onclick   = onClick || null;
}

document.querySelectorAll('.nav-btn').forEach(b =>
  b.addEventListener('click', () => router.navigate(b.dataset.route)));

// ── Route icons ──────────────────────────────────────────────────────────────
const PLUS_ICON = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/>
</svg>`;
const LOGOUT_ICON = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
</svg>`;

// ── Guards & routes ───────────────────────────────────────────────────────────
function guard(fn) {
  return () => { const u = auth.getCurrentUser(); if (!u) { router.navigate('auth'); return; } fn(u); };
}

router.register('auth', () => {
  hideChrome();
  renderAuth(view, () => router.navigate('feed'));
});
router.register('feed', guard(u => {
  showChrome(u.id); setNav('feed');
  setHeaderAction(PLUS_ICON, () => renderFeed.openAddPost(u));
  renderFeed(view, u);
}));
router.register('friends', guard(u => {
  showChrome(u.id); setNav('friends');
  setHeaderAction('', null);
  renderFriends(view, u);
}));
router.register('groups', guard(u => {
  showChrome(u.id); setNav('groups');
  setHeaderAction(PLUS_ICON, () => renderGroups.openCreate(u));
  renderGroups(view, u);
}));
router.register('profile', guard(u => {
  showChrome(u.id); setNav('profile');
  setHeaderAction(LOGOUT_ICON, () => { auth.logout(); router.navigate('auth'); showToast('Tot de volgende sessie 💪'); });
  renderProfile(view, u);
}));

// ── Init ─────────────────────────────────────────────────────────────────────
const user = auth.getCurrentUser();
if (!user) window.location.hash = 'auth';
else if (!window.location.hash || window.location.hash === '#') window.location.hash = 'feed';
router.init();
