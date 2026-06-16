import { api }                                             from '../api.js';
import { auth }                                           from '../auth.js';
import { openModal, closeModal, avatar, timeAgo, showToast } from '../main.js';
import { mediaBottomSheet }                               from '../media.js';

export async function renderProfile(container, currentUserSession) {
    let tab = 'progress';
    let posts = [], progress = [], me;

    async function load() {
        try {
            [me, posts, progress] = await Promise.all([
                api.me(),
                api.getPosts(),
                api.getProgress(),
            ]);
            posts    = posts.filter(p => p.user_id === currentUserSession.id);
        } catch(e) { showToast(e.message, 'error'); }
        render();
    }

    function render() {
        if (!me) { container.innerHTML = `<div class="flex items-center justify-center h-40"><div class="anim-spin w-7 h-7 border-2 border-[#DC2626] border-t-transparent rounded-full"></div></div>`; return; }
        const joinDate = new Date(me.created_at).toLocaleDateString('nl-NL', { month:'long', year:'numeric' });

        container.innerHTML = `
          <div class="anim-fade pb-10" style="background:#F5F5F5;">
            <div class="px-4 pt-6 pb-5 bg-white border-b border-[#F3F4F6]">
              <div class="flex items-start gap-4 mb-5">
                <div class="relative flex-shrink-0">${avatar(me, 76)}</div>
                <div class="flex-1 min-w-0 pt-1">
                  <p class="font-black text-[22px] leading-tight text-[#111827]">${me.display_name}</p>
                  <p class="text-[#9CA3AF] text-[13px] mb-1">@${me.username}</p>
                  ${me.bio?`<p class="text-[#374151] text-[14px] leading-snug">${me.bio}</p>`:''}
                  <p class="text-[#9CA3AF] text-[11px] mt-2 font-medium">Lid sinds ${joinDate}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl divide-x divide-[#E5E7EB] mb-4">
                ${[
                  { label:'Posts',   val:posts.length,    icon:'📸' },
                  { label:'Progress', val:progress.length, icon:'📷' },
                ].map(s => `<div class="flex flex-col items-center py-4 gap-0.5"><span class="text-[22px] font-black text-[#111827]">${s.val}</span><span class="text-[11px] text-[#9CA3AF] font-semibold">${s.label}</span></div>`).join('')}
              </div>
              <button id="btn-edit" class="btn-secondary flex items-center justify-center gap-2 py-3">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Profiel bewerken
              </button>
            </div>

            <div class="tab-bar">
              <button class="tab-btn ${tab==='progress'?'active':''}" data-tab="progress">
                <div class="flex items-center justify-center gap-1.5">
                  <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  Progress
                </div>
              </button>
              <button class="tab-btn ${tab==='posts'?'active':''}" data-tab="posts">
                <div class="flex items-center justify-center gap-1.5">
                  <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Posts
                </div>
              </button>
            </div>

            <div class="pt-3">
              ${tab === 'progress' ? `
              <div class="px-4">
                <button id="btn-add-progress" class="w-full border-2 border-dashed border-[#E5E7EB] rounded-2xl py-4 mb-4 flex items-center justify-center gap-2 text-[13px] font-semibold text-[#9CA3AF] hover:border-[#DC2626] hover:text-[#DC2626] transition-all active:scale-97">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/></svg>
                  Progress foto toevoegen
                </button>
                ${progress.length
                  ? `<div class="grid grid-cols-2 gap-3">
                      ${progress.map(ph => `
                        <div class="progress-item" data-pid="${ph.id}">
                          <img src="${ph.image}" alt="${ph.note||'progress'}" loading="lazy">
                          <div class="overlay">
                            <div class="flex-1 min-w-0">
                              ${ph.note?`<p class="text-[12px] font-bold text-white truncate">${ph.note}</p>`:''}
                              <p class="text-[10px] text-[#D1D5DB] mt-0.5">${timeAgo(ph.created_at)}</p>
                            </div>
                            <button class="del-progress flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all" data-id="${ph.id}">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </div>`).join('')}
                    </div>`
                  : `<div class="empty-state"><div class="empty-icon">📷</div><p class="font-bold text-[#111827] text-[16px]">Nog geen progress foto's</p><p class="text-[#9CA3AF] text-sm">Leg je transformatie vast.</p></div>`}
              </div>` : ''}

              ${tab === 'posts' ? (posts.length
                ? `<div class="photo-grid">${posts.map(p=>`<div class="photo-grid-item"><img src="${p.image}" alt="post" loading="lazy"></div>`).join('')}</div>`
                : `<div class="empty-state"><div class="empty-icon">🏋️</div><p class="font-bold text-[#111827] text-[16px]">Nog geen posts</p><p class="text-[#9CA3AF] text-sm">Deel je eerste moment in de feed.</p></div>`) : ''}
            </div>
          </div>`;

        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => { tab = btn.dataset.tab; render(); });
        });

        document.getElementById('btn-edit')?.addEventListener('click', () => {
            let uploadedAvatar = me.avatar || '';
            openModal(`
              <div class="px-5 pb-6">
                <div class="flex items-center justify-between pt-2 pb-5">
                  <h2 class="text-[18px] font-black text-[#111827]">Profiel bewerken</h2>
                  <button id="mc" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div class="flex flex-col gap-4">
                  <!-- Avatar picker -->
                  <div class="flex flex-col items-center gap-3">
                    <div class="relative">
                      <img id="e-avatar-preview" src="${me.avatar||''}" alt="" style="width:80px;height:80px;border-radius:50%;object-fit:cover;background:#F3F4F6;display:${me.avatar?'block':'none'};">
                      <div id="e-avatar-initials" class="avatar-fallback" style="width:80px;height:80px;font-size:30px;display:${me.avatar?'none':'flex'};">${me.display_name.charAt(0).toUpperCase()}</div>
                      <button id="e-avatar-btn" style="position:absolute;bottom:0;right:0;width:26px;height:26px;border-radius:50%;background:#DC2626;border:2px solid white;cursor:pointer;display:flex;align-items:center;justify-content:center;">
                        <svg style="width:13px;height:13px;" fill="none" stroke="white" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                      </button>
                    </div>
                    <p id="e-avatar-status" class="text-[12px] text-[#9CA3AF]">Tik op + om foto te wijzigen</p>
                  </div>
                  <div><label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Weergavenaam</label>
                  <input id="e-name" type="text" value="${me.display_name}" class="rs-input" maxlength="60"/></div>
                  <div><label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Bio <span class="normal-case text-[#9CA3AF] font-normal">(max 120)</span></label>
                  <textarea id="e-bio" rows="2" class="rs-input" maxlength="120">${me.bio||''}</textarea></div>
                  <button id="e-sub" class="btn-primary">Opslaan</button>
                </div>
              </div>`, c => {
                c.querySelector('#mc').addEventListener('click', closeModal);

                c.querySelector('#e-avatar-btn').addEventListener('click', async () => {
                    const status = c.querySelector('#e-avatar-status');
                    try {
                        status.textContent = 'Uploaden…';
                        const result = await mediaBottomSheet({ accept: 'image/*' });
                        uploadedAvatar = result.url;
                        const preview = c.querySelector('#e-avatar-preview');
                        const initials = c.querySelector('#e-avatar-initials');
                        preview.src = result.url;
                        preview.style.display = 'block';
                        initials.style.display = 'none';
                        status.textContent = 'Foto gewijzigd ✓';
                    } catch(e) {
                        status.textContent = e.message !== 'Geannuleerd' ? e.message : 'Tik op + om foto te wijzigen';
                    }
                });

                c.querySelector('#e-sub').addEventListener('click', async () => {
                    const sub = c.querySelector('#e-sub');
                    sub.disabled=true; sub.textContent='…';
                    try {
                        await auth.updateProfile({
                            displayName: c.querySelector('#e-name').value.trim() || me.display_name,
                            bio:         c.querySelector('#e-bio').value.trim(),
                            avatar:      uploadedAvatar,
                        });
                        closeModal();
                        showToast('Profiel opgeslagen ✓', 'success');
                        await load();
                    } catch(err) { sub.disabled=false; sub.textContent='Opslaan'; showToast(err.message,'error'); }
                });
            });
        });

        document.getElementById('btn-add-progress')?.addEventListener('click', () => {
            let uploadedUrl = null;
            openModal(`
              <div class="px-5 pb-6">
                <div class="flex items-center justify-between pt-2 pb-5">
                  <h2 class="text-[18px] font-black text-[#111827]">Progress foto toevoegen</h2>
                  <button id="mc" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div class="flex flex-col gap-4">
                  <button id="pp-pick" class="w-full border-2 border-dashed border-[#E5E7EB] rounded-2xl flex flex-col items-center justify-center gap-2 text-[#9CA3AF] hover:border-[#DC2626] hover:text-[#DC2626] transition-all" style="min-height:160px;">
                    <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/></svg>
                    <span class="text-[14px] font-semibold">Foto kiezen</span>
                    <span class="text-[12px]">Galerie of camera</span>
                  </button>
                  <div id="pp-preview" class="hidden rounded-2xl overflow-hidden bg-[#F3F4F6]" style="max-height:260px;"><img id="pp-prev-img" class="w-full object-cover" style="max-height:260px;" alt="preview"></div>
                  <div id="pp-progress" class="hidden"><div class="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden"><div id="pp-bar" class="h-full bg-[#DC2626] rounded-full transition-all" style="width:0%"></div></div></div>
                  <input id="pp-note" type="text" placeholder="Notitie, bijv. Week 8 💪" class="rs-input" maxlength="60"/>
                  <div id="pp-err" class="hidden bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3"></div>
                  <button id="pp-sub" class="btn-primary" disabled style="opacity:0.5;">Toevoegen</button>
                </div>
              </div>`, c => {
                c.querySelector('#mc').addEventListener('click', closeModal);
                c.querySelector('#pp-pick').addEventListener('click', async () => {
                    const err = c.querySelector('#pp-err');
                    err.classList.add('hidden');
                    try {
                        const result = await mediaBottomSheet({ accept: 'image/*', onProgress: pct => {
                            c.querySelector('#pp-progress').classList.remove('hidden');
                            c.querySelector('#pp-bar').style.width = (pct*100)+'%';
                        }});
                        uploadedUrl = result.url;
                        const preview = c.querySelector('#pp-preview');
                        preview.classList.remove('hidden');
                        c.querySelector('#pp-prev-img').src = result.url;
                        c.querySelector('#pp-pick').style.display='none';
                        c.querySelector('#pp-progress').classList.add('hidden');
                        const sub = c.querySelector('#pp-sub'); sub.disabled=false; sub.style.opacity='1';
                    } catch(e) {
                        if (e.message !== 'Geannuleerd') { c.querySelector('#pp-err').textContent=e.message; err.classList.remove('hidden'); }
                        c.querySelector('#pp-progress').classList.add('hidden');
                    }
                });
                c.querySelector('#pp-sub').addEventListener('click', async () => {
                    const note = c.querySelector('#pp-note').value.trim();
                    const err  = c.querySelector('#pp-err');
                    const sub  = c.querySelector('#pp-sub');
                    if (!uploadedUrl) { err.textContent='Voeg eerst een foto toe.'; err.classList.remove('hidden'); return; }
                    sub.disabled=true; sub.textContent='…';
                    try {
                        await api.addProgress(uploadedUrl, note);
                        closeModal();
                        showToast('Progress foto toegevoegd 📸', 'success');
                        await load();
                    } catch(e) { err.textContent=e.message; err.classList.remove('hidden'); sub.disabled=false; sub.textContent='Toevoegen'; }
                });
            });
        });

        container.querySelectorAll('.del-progress').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                if (!confirm('Progress foto verwijderen?')) return;
                try {
                    await api.deleteProgress(btn.dataset.id);
                    showToast('Foto verwijderd', 'info');
                    await load();
                } catch(e) { showToast(e.message,'error'); }
            });
        });
    }

    container.innerHTML = `<div class="flex items-center justify-center h-40"><div class="anim-spin w-7 h-7 border-2 border-[#DC2626] border-t-transparent rounded-full"></div></div>`;
    await load();
}
