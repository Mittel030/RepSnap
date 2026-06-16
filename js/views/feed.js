import { store }                                               from '../store.js';
import { openModal, closeModal, timeAgo, avatar, showToast }  from '../main.js';

function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Post card ─────────────────────────────────────────────────────────────────
function postCard(post, currentUser) {
  const author = store.getUserById(post.userId);
  if (!author) return '';
  const liked  = store.isLiked(post.id, currentUser.id);
  const count  = store.getLikeCount(post.id);
  const isOwn  = post.userId === currentUser.id;

  return `
    <article class="bg-white border-b border-[#F3F4F6]" data-post-id="${post.id}">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 pt-4 pb-3">
        <div class="flex items-center gap-3">
          <div class="${isOwn ? 'ring-2 ring-[#DC2626] ring-offset-2 ring-offset-white rounded-full' : 'story-ring'}">
            ${isOwn
              ? `<div class="p-[2px] rounded-full">${avatar(author, 36)}</div>`
              : `<div class="story-ring-inner">${avatar(author, 36)}</div>`
            }
          </div>
          <div>
            <p class="text-[14px] font-bold text-[#111827] leading-none">${author.displayName}</p>
            <p class="text-[12px] text-[#9CA3AF] mt-0.5">@${author.username} · ${timeAgo(post.createdAt)}</p>
          </div>
        </div>
        ${isOwn ? `
        <button class="delete-post p-1.5 rounded-full text-[#D1D5DB] hover:text-red-500 hover:bg-red-50 transition-all" data-id="${post.id}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>` : ''}
      </div>

      <!-- Image -->
      <div class="relative doubletap-zone cursor-pointer" data-pid="${post.id}">
        <img src="${post.image}" alt="post" class="post-img" loading="lazy"
          onerror="this.style.minHeight='200px';this.style.background='#F3F4F6';">
      </div>

      <!-- Actions -->
      <div class="post-actions">
        <button class="like-btn post-action-btn ${liked ? 'liked' : ''}" data-pid="${post.id}"
          style="${liked ? 'color:#DC2626' : ''}" aria-label="Like">
          <svg class="w-[22px] h-[22px]" fill="${liked ? '#DC2626' : 'none'}"
            stroke="${liked ? '#DC2626' : 'currentColor'}" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <span class="like-count text-[#6B7280]" data-pid="${post.id}">${count}</span>
        </button>
      </div>

      <!-- Caption -->
      ${post.caption ? `
      <p class="px-4 pb-4 text-[14px] leading-snug text-[#374151]">
        <span class="font-bold text-[#111827]">${author.username} </span>${escHtml(post.caption)}
      </p>` : '<div class="pb-2"></div>'}

    </article>`;
}

// ── Stories bar ───────────────────────────────────────────────────────────────
function storiesBar(currentUser) {
  const friendIds = store.getFriendIds(currentUser.id);
  const users     = [currentUser, ...friendIds.map(id => store.getUserById(id)).filter(Boolean)];
  return `
    <div class="overflow-x-auto no-scrollbar border-b border-[#F3F4F6] bg-white">
      <div class="flex gap-3 px-4 py-4 w-max">
        ${users.map((u, i) => `
          <div class="flex flex-col items-center gap-1.5 cursor-pointer active:opacity-70 transition-opacity">
            ${i === 0
              ? `<div class="ring-2 ring-[#DC2626] ring-offset-2 ring-offset-white rounded-full p-[2px]">${avatar(u, 54)}</div>`
              : `<div class="story-ring"><div class="story-ring-inner">${avatar(u, 54)}</div></div>`
            }
            <span class="text-[10px] font-semibold text-[#9CA3AF] max-w-[58px] truncate">
              ${i === 0 ? 'Jij' : u.username}
            </span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// ── Double-tap like ───────────────────────────────────────────────────────────
let lastTap = { pid: null, time: 0 };
function handleDoubleTap(pid, currentUser, container) {
  const now = Date.now();
  if (lastTap.pid === pid && now - lastTap.time < 350) {
    if (!store.isLiked(pid, currentUser.id)) {
      store.toggleLike(pid, currentUser.id);
      updateLikeUI(pid, currentUser.id, container);
    }
    burstHeart();
    lastTap = { pid: null, time: 0 };
  } else {
    lastTap = { pid, time: now };
  }
}

function burstHeart() {
  const el = document.getElementById('heart-burst');
  if (!el) return;
  el.classList.remove('hidden');
  el.classList.add('heart-burst-active');
  setTimeout(() => { el.classList.add('hidden'); el.classList.remove('heart-burst-active'); }, 750);
}

function updateLikeUI(pid, userId, container) {
  const liked = store.isLiked(pid, userId);
  const count = store.getLikeCount(pid);
  container.querySelectorAll(`.like-btn[data-pid="${pid}"]`).forEach(btn => {
    const icon = btn.querySelector('svg');
    btn.classList.toggle('liked', liked);
    btn.style.color = liked ? '#DC2626' : '';
    if (icon) { icon.setAttribute('fill', liked ? '#DC2626' : 'none'); icon.setAttribute('stroke', liked ? '#DC2626' : 'currentColor'); }
    btn.classList.add('anim-pop');
    setTimeout(() => btn.classList.remove('anim-pop'), 400);
  });
  container.querySelectorAll(`.like-count[data-pid="${pid}"]`).forEach(el => { el.textContent = count; });
}

// ── Render ────────────────────────────────────────────────────────────────────
export function renderFeed(container, currentUser) {
  const friendIds = store.getFriendIds(currentUser.id);
  const allowIds  = [currentUser.id, ...friendIds];
  const posts     = store.getPosts().filter(p => allowIds.includes(p.userId));

  container.innerHTML = `
    <div class="anim-fade" style="background:#F5F5F5;">
      ${storiesBar(currentUser)}
      ${posts.length
        ? posts.map(p => postCard(p, currentUser)).join('')
        : `<div class="empty-state">
            <div class="empty-icon">🏋️</div>
            <p class="font-bold text-[17px] text-[#111827]">Nog geen posts</p>
            <p class="text-[#9CA3AF] text-sm">Voeg vrienden toe om hun gym-moments te zien.</p>
           </div>`
      }
      <div class="h-6"></div>
    </div>`;

  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.toggleLike(btn.dataset.pid, currentUser.id);
      updateLikeUI(btn.dataset.pid, currentUser.id, container);
    });
  });

  container.querySelectorAll('.doubletap-zone').forEach(zone => {
    zone.addEventListener('click', () => handleDoubleTap(zone.dataset.pid, currentUser, container));
  });

  container.querySelectorAll('.delete-post').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Post verwijderen?')) return;
      store.deletePost(btn.dataset.id);
      showToast('Post verwijderd', 'info');
      renderFeed(container, currentUser);
    });
  });
}

// ── Add post modal ────────────────────────────────────────────────────────────
renderFeed.openAddPost = function(currentUser) {
  openModal(`
    <div class="px-5 pb-6">
      <div class="flex items-center justify-between pt-2 pb-5">
        <h2 class="text-[18px] font-black text-[#111827]">Nieuwe post</h2>
        <button id="modal-close" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <form id="add-post-form" class="flex flex-col gap-4" novalidate>
        <div>
          <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Afbeelding URL</label>
          <input id="post-img" type="url" placeholder="https://images.unsplash.com/…" class="rs-input" autocomplete="off"/>
        </div>
        <div id="img-preview" class="hidden rounded-2xl overflow-hidden bg-[#F3F4F6]" style="aspect-ratio:1/1;">
          <img id="preview-img" class="w-full h-full object-cover" alt="preview">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Caption</label>
          <textarea id="post-caption" rows="3" placeholder="Wat deed je vandaag? 💪" class="rs-input"></textarea>
        </div>
        <div id="post-error" class="hidden bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3"></div>
        <button type="submit" class="btn-primary">Post delen</button>
      </form>
    </div>
  `, content => {
    content.querySelector('#modal-close').addEventListener('click', closeModal);
    content.querySelector('#post-img').addEventListener('input', e => {
      const url = e.target.value.trim();
      const preview = content.querySelector('#img-preview');
      const img     = content.querySelector('#preview-img');
      if (url) { img.src = url; preview.classList.remove('hidden'); }
      else       preview.classList.add('hidden');
    });
    content.querySelector('#add-post-form').addEventListener('submit', e => {
      e.preventDefault();
      const image   = content.querySelector('#post-img').value.trim();
      const caption = content.querySelector('#post-caption').value.trim();
      const errEl   = content.querySelector('#post-error');
      if (!image) { errEl.textContent='Voeg een afbeelding URL toe.'; errEl.classList.remove('hidden'); return; }
      store.addPost({ id: Date.now().toString(36)+Math.random().toString(36).slice(2), userId:currentUser.id, image, caption, createdAt:Date.now() });
      closeModal();
      showToast('Post gedeeld! 🔥', 'success');
      renderFeed(document.getElementById('view'), currentUser);
    });
  });
};
