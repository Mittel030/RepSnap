import { auth }                           from './auth.js';
import { router }                         from './router.js';
import { renderAuth }                     from './views/auth.js';
import { renderFeed }                     from './views/feed.js';
import { renderFriends }                  from './views/friends.js';
import { renderGroups }                   from './views/groups.js';
import { renderProfile }                  from './views/profile.js';
import { renderChat }                     from './views/chat.js';
import { handleIncomingSignal, hasActiveCall } from './views/call.js';
import { api }                            from './api.js';

// ── Shared helpers ────────────────────────────────────────────────────────────
export function timeAgo(ts) {
    const d = Date.now() - ts;
    if (d < 60000)      return 'zojuist';
    if (d < 3600000)    return `${Math.floor(d/60000)}m`;
    if (d < 86400000)   return `${Math.floor(d/3600000)}u`;
    if (d < 86400000*7) return `${Math.floor(d/86400000)}d`;
    return new Date(ts).toLocaleDateString('nl-NL', { day:'numeric', month:'short' });
}

export function avatar(user, size = 36) {
    const initials = (user?.display_name || user?.username || '?').charAt(0).toUpperCase();
    const fs = Math.floor(size * 0.37);
    if (user?.avatar) {
        return `<img src="${user.avatar}" alt="${user.display_name || user.username}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="avatar-fallback" style="width:${size}px;height:${size}px;font-size:${fs}px;display:none;">${initials}</div>`;
    }
    return `<div class="avatar-fallback" style="width:${size}px;height:${size}px;font-size:${fs}px;">${initials}</div>`;
}

export function openModal(html, onOpen) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = `<div class="flex justify-center pt-3 pb-1"><div class="w-10 h-1 rounded-full bg-[#D1D5DB]"></div></div>${html}`;
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

export function showConfirm({ title, body = '', confirm: confirmLabel = 'Bevestigen', destructive = true }) {
    return new Promise(resolve => {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        content.innerHTML = `
          <div class="flex justify-center pt-3 pb-1"><div class="w-10 h-1 rounded-full bg-[#CCCAC7]"></div></div>
          <div class="px-5 pt-4 pb-8">
            <p class="text-[18px] font-black text-[#111827] mb-1">${title}</p>
            ${body ? `<p class="text-[14px] text-[#6B7280] leading-snug mt-1">${body}</p>` : ''}
            <div class="flex flex-col gap-2 mt-6">
              <button id="sc-ok" class="btn-primary" style="${destructive ? 'background:#DC2626;box-shadow:0 4px 16px rgba(220,38,38,.28);' : ''}">${confirmLabel}</button>
              <button id="sc-cancel" class="btn-secondary">Annuleren</button>
            </div>
          </div>`;
        overlay.classList.remove('hidden');
        overlay.classList.add('open');
        const done = (val) => { closeModal(); resolve(val); };
        content.querySelector('#sc-ok').addEventListener('click', () => done(true));
        content.querySelector('#sc-cancel').addEventListener('click', () => done(false));
        overlay.onclick = e => { if (e.target === overlay) done(false); };
    });
}

export function showToast(msg, type = 'info') {
    document.getElementById('rs-toast')?.remove();
    const bg = { info:'#374151', success:'#166534', error:'#991B1B' }[type] || '#374151';
    const el = document.createElement('div');
    el.id = 'rs-toast';
    el.style.cssText = `position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:${bg};color:white;padding:11px 22px;border-radius:16px;font-size:14px;font-weight:600;font-family:Inter,sans-serif;white-space:nowrap;z-index:9999;animation:slideUp .25s ease;box-shadow:0 6px 24px rgba(0,0,0,0.18);max-width:360px;text-align:center;`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el?.remove(), 2800);
}

// ── Chrome ────────────────────────────────────────────────────────────────────
const view    = document.getElementById('view');
const header  = document.getElementById('app-header');
const navEl   = document.getElementById('bottom-nav');
const hAction = document.getElementById('header-action');

function showChrome() { header.style.display='flex'; navEl.style.display='block'; }
function hideChrome() { header.style.display='none'; navEl.style.display='none'; }
function setNav(route) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.route === route));
}
function setHeaderAction(svg, onClick) { hAction.innerHTML = svg||''; hAction.onclick = onClick||null; }

document.querySelectorAll('.nav-btn').forEach(b =>
    b.addEventListener('click', () => router.navigate(b.dataset.route)));

const PLUS_ICON   = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/></svg>`;
const LOGOUT_ICON = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>`;

function guard(fn) {
    return async () => {
        const u = auth.getCurrentUser();
        if (!u) { router.navigate('auth'); return; }
        await fn(u);
    };
}

router.register('auth', () => { hideChrome(); renderAuth(view, () => router.navigate('feed')); });

router.register('feed', guard(async u => {
    showChrome(); setNav('feed');
    setHeaderAction(PLUS_ICON, () => renderFeed.openAddPost(u));
    await renderFeed(view, u);
}));

router.register('friends', guard(async u => {
    showChrome(); setNav('friends');
    setHeaderAction('', null);
    await renderFriends(view, u);
}));

router.register('chat', guard(async u => {
    showChrome(); setNav('chat');
    setHeaderAction('', null);
    await renderChat(view, u);
}));

router.register('groups', guard(async u => {
    showChrome(); setNav('groups');
    setHeaderAction(PLUS_ICON, () => renderGroups.openCreate(u));
    await renderGroups(view, u);
}));

router.register('profile', guard(async u => {
    showChrome(); setNav('profile');
    setHeaderAction(LOGOUT_ICON, async () => {
        await auth.logout();
        router.navigate('auth');
        showToast('Tot de volgende keer!');
    });
    await renderProfile(view, u);
}));

// ── Incoming call polling ─────────────────────────────────────────────────────
function startCallPolling() {
    let since = Date.now();
    setInterval(async () => {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;
        try {
            const signals = await api.getSignals(since);
            for (const s of signals) {
                since = Math.max(since, s.at + 1);
                if (s.type === 'offer' || s.type === 'hangup') {
                    await handleIncomingSignal(s, currentUser);
                }
            }
        } catch {}
    }, 2000);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
    const user = await auth.init();
    if (!user) window.location.hash = 'auth';
    else if (!window.location.hash || window.location.hash === '#') window.location.hash = 'feed';
    router.init();
    if (user) startCallPolling();
})();
