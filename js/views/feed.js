import { api }                                                         from '../api.js';
import { openModal, closeModal, timeAgo, avatar, showToast, showConfirm } from '../main.js';
import { mediaBottomSheet, mediaTag }                                     from '../media.js';

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function postCard(post, currentUser) {
    const isOwn  = post.user_id === currentUser.id;
    const liked  = post.user_liked > 0;
    const count  = post.like_count || 0;
    const isVideo = post.media_type === 'video';
    return `
      <article class="mx-3 mb-3 bg-white rounded-2xl overflow-hidden" style="box-shadow:0 2px 10px rgba(0,0,0,0.07),0 1px 3px rgba(0,0,0,0.04);" data-post-id="${post.id}">
        <div class="flex items-center justify-between px-4 pt-4 pb-3">
          <div class="flex items-center gap-3">
            <div class="${isOwn?'ring-2 ring-[#DC2626] ring-offset-2 ring-offset-white rounded-full':'story-ring'}">
              <div class="${isOwn?'p-[2px] rounded-full':'story-ring-inner'}">${avatar(post, 36)}</div>
            </div>
            <div>
              <p class="text-[14px] font-bold text-[#111827] leading-none">${post.display_name}</p>
              <p class="text-[12px] text-[#A8A29E] mt-0.5">@${post.username} · ${timeAgo(post.created_at)}</p>
            </div>
          </div>
          ${isOwn?`<button class="delete-post p-1.5 rounded-full text-[#CCCAC7] hover:text-red-500 hover:bg-red-50 transition-all" data-id="${post.id}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>`:''}
        </div>
        <div class="${isVideo?'':'relative doubletap-zone cursor-pointer'}" data-pid="${post.id}">
          ${isVideo
            ? mediaTag(post.image, 'video', 'display:block;')
            : `<img src="${post.image}" alt="post" class="post-img" loading="lazy" onerror="this.style.minHeight='200px';this.style.background='#F0EEEB';">`}
        </div>
        <div class="post-actions">
          <button class="like-btn post-action-btn ${liked?'liked':''}" data-pid="${post.id}" style="${liked?'color:#DC2626':''}" aria-label="Like">
            <svg class="w-[22px] h-[22px]" fill="${liked?'#DC2626':'none'}" stroke="${liked?'#DC2626':'currentColor'}" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span class="like-count text-[#6B7280]" data-pid="${post.id}" ${count===0?'style="display:none"':''}>${count}</span>
          </button>
        </div>
        ${post.caption?`<p class="px-4 pb-4 text-[14px] leading-snug text-[#374151]"><span class="font-bold text-[#111827]">${post.username} </span>${esc(post.caption)}</p>`:'<div class="pb-2"></div>'}
      </article>`;
}

let lastTap = { pid: null, time: 0 };
function handleDoubleTap(pid, container, posts) {
    const now = Date.now();
    if (lastTap.pid === pid && now - lastTap.time < 350) {
        const post = posts.find(p => p.id === pid);
        if (post && !post.user_liked) {
            api.toggleLike(pid).then(({ liked, count }) => {
                post.user_liked = liked ? 1 : 0;
                post.like_count = count;
                updateLikeUI(pid, liked, count, container);
            }).catch(()=>{});
            burstHeart();
        }
        lastTap = { pid:null, time:0 };
    } else {
        lastTap = { pid, time:now };
    }
}

function burstHeart() {
    const el = document.getElementById('heart-burst');
    if (!el) return;
    el.classList.remove('hidden'); el.classList.add('heart-burst-active');
    setTimeout(() => { el.classList.add('hidden'); el.classList.remove('heart-burst-active'); }, 750);
}

function updateLikeUI(pid, liked, count, container) {
    container.querySelectorAll(`.like-btn[data-pid="${pid}"]`).forEach(btn => {
        const icon = btn.querySelector('svg');
        btn.classList.toggle('liked', liked);
        btn.style.color = liked ? '#DC2626' : '';
        if (icon) { icon.setAttribute('fill', liked?'#DC2626':'none'); icon.setAttribute('stroke', liked?'#DC2626':'currentColor'); }
        btn.classList.add('anim-pop');
        setTimeout(() => btn.classList.remove('anim-pop'), 400);
    });
    container.querySelectorAll(`.like-count[data-pid="${pid}"]`).forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? '' : 'none';
    });
}

export async function renderFeed(container, currentUser) {
    container.innerHTML = `<div class="flex items-center justify-center h-40"><div class="anim-spin w-7 h-7 border-2 border-[#DC2626] border-t-transparent rounded-full"></div></div>`;
    let posts;
    try { posts = await api.getPosts(); }
    catch { container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p class="font-bold text-[#111827]">Kan feed niet laden</p></div>`; return; }

    container.innerHTML = `
      <div class="anim-fade pt-3" style="background:#F7F6F4;">
        ${posts.length
          ? posts.map(p => postCard(p, currentUser)).join('')
          : `<div class="empty-state"><div class="empty-icon">🏋️</div><p class="font-bold text-[17px] text-[#111827]">Nog geen posts</p><p class="text-[#A8A29E] text-sm">Voeg vrienden toe om hun moments te zien.</p></div>`}
        <div class="h-4"></div>
      </div>`;

    container.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const post = posts.find(p => p.id === btn.dataset.pid);
            try {
                const { liked, count } = await api.toggleLike(btn.dataset.pid);
                if (post) { post.user_liked = liked?1:0; post.like_count = count; }
                updateLikeUI(btn.dataset.pid, liked, count, container);
            } catch {}
        });
    });

    container.querySelectorAll('.doubletap-zone').forEach(zone => {
        zone.addEventListener('click', () => handleDoubleTap(zone.dataset.pid, container, posts));
    });

    container.querySelectorAll('.delete-post').forEach(btn => {
        btn.addEventListener('click', async () => {
            const ok = await showConfirm({ title: 'Post verwijderen?', body: 'Dit kan niet ongedaan worden gemaakt.', confirm: 'Verwijderen' });
            if (!ok) return;
            try {
                await api.deletePost(btn.dataset.id);
                showToast('Post verwijderd', 'info');
                await renderFeed(container, currentUser);
            } catch(e) { showToast(e.message, 'error'); }
        });
    });
}

renderFeed.openAddPost = function(currentUser) {
    let uploadedUrl = null, uploadedType = 'image';

    openModal(`
      <div class="px-5 pb-6">
        <div class="flex items-center justify-between pt-2 pb-5">
          <h2 class="text-[18px] font-black text-[#111827]">Nieuwe post</h2>
          <button id="modal-close" class="w-9 h-9 flex items-center justify-center rounded-full text-[#A8A29E] hover:text-[#374151] hover:bg-[#F0EEEB] transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div class="flex flex-col gap-4">
          <!-- Media picker -->
          <button id="pick-media" class="w-full border-2 border-dashed border-[#EDEAE7] rounded-2xl flex flex-col items-center justify-center gap-2 text-[#A8A29E] hover:border-[#DC2626] hover:text-[#DC2626] transition-all" style="min-height:180px;">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/></svg>
            <span class="text-[14px] font-semibold">Foto of video toevoegen</span>
            <span class="text-[12px]">Galerie of camera</span>
          </button>
          <div id="media-preview" class="hidden rounded-2xl overflow-hidden bg-[#F0EEEB]" style="max-height:320px;"></div>
          <div id="upload-progress" class="hidden">
            <div class="h-1.5 bg-[#F0EEEB] rounded-full overflow-hidden">
              <div id="progress-bar" class="h-full bg-[#DC2626] rounded-full transition-all" style="width:0%"></div>
            </div>
          </div>
          <textarea id="post-caption" rows="3" placeholder="Schrijf een caption…" class="rs-input"></textarea>
          <div id="post-error" class="hidden bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3"></div>
          <button id="post-submit" class="btn-primary" disabled style="opacity:0.5;">Post delen</button>
        </div>
      </div>`, content => {
        content.querySelector('#modal-close').addEventListener('click', closeModal);

        content.querySelector('#pick-media').addEventListener('click', async () => {
            const errEl = content.querySelector('#post-error');
            errEl.classList.add('hidden');
            try {
                const result = await mediaBottomSheet({
                    onProgress: pct => {
                        content.querySelector('#upload-progress').classList.remove('hidden');
                        content.querySelector('#progress-bar').style.width = (pct * 100) + '%';
                    }
                });
                uploadedUrl  = result.url;
                uploadedType = result.type;

                const preview = content.querySelector('#media-preview');
                preview.classList.remove('hidden');
                preview.innerHTML = result.type === 'video'
                    ? `<video src="${result.url}" controls playsinline style="width:100%;max-height:280px;object-fit:cover;"></video>`
                    : `<img src="${result.url}" style="width:100%;max-height:280px;object-fit:cover;">`;

                content.querySelector('#pick-media').style.display = 'none';
                content.querySelector('#upload-progress').classList.add('hidden');
                const sub = content.querySelector('#post-submit');
                sub.disabled = false; sub.style.opacity = '1';
            } catch(e) {
                if (e.message !== 'Geannuleerd') { errEl.textContent = e.message; errEl.classList.remove('hidden'); }
                content.querySelector('#upload-progress').classList.add('hidden');
            }
        });

        content.querySelector('#post-submit').addEventListener('click', async () => {
            const caption = content.querySelector('#post-caption').value.trim();
            const errEl   = content.querySelector('#post-error');
            const submit  = content.querySelector('#post-submit');
            if (!uploadedUrl) { errEl.textContent='Voeg eerst een foto of video toe.'; errEl.classList.remove('hidden'); return; }
            submit.disabled=true; submit.textContent='…';
            try {
                await api.addPost(uploadedUrl, caption, uploadedType);
                closeModal();
                showToast('Post gedeeld! 🔥', 'success');
                await renderFeed(document.getElementById('view'), currentUser);
            } catch(e) {
                errEl.textContent=e.message; errEl.classList.remove('hidden');
                submit.disabled=false; submit.textContent='Post delen';
            }
        });
    });
};
