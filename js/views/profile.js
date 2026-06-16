import { store }                                           from '../store.js';
import { auth }                                           from '../auth.js';
import { openModal, closeModal, avatar, timeAgo, showToast } from '../main.js';

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

export function renderProfile(container, currentUserSession) {
  let tab = 'progress';

  function render() {
    const me         = store.getUserById(currentUserSession.id) || currentUserSession;
    const myPosts    = store.getPosts().filter(p => p.userId === me.id);
    const myProgress = store.getProgressOf(me.id);
    const friendCnt  = store.getFriendIds(me.id).length;
    const groupCnt   = store.getMyGroups(me.id).length;

    const joinDate = new Date(me.joinedAt || Date.now()).toLocaleDateString('nl-NL', { month:'long', year:'numeric' });

    container.innerHTML = `
      <div class="anim-fade pb-10" style="background:#F5F5F5;">

        <!-- Profile header -->
        <div class="px-4 pt-6 pb-5 bg-white border-b border-[#F3F4F6]">
          <div class="flex items-start gap-4 mb-5">
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
              ${avatar(me, 76)}
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0 pt-1">
              <p class="font-black text-[22px] leading-tight text-[#111827]">${me.displayName}</p>
              <p class="text-[#9CA3AF] text-[13px] mb-1">@${me.username}</p>
              ${me.bio ? `<p class="text-[#374151] text-[14px] leading-snug">${me.bio}</p>` : ''}
              <p class="text-[#9CA3AF] text-[11px] mt-2 font-medium">Lid sinds ${joinDate}</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl divide-x divide-[#E5E7EB] mb-4">
            ${[
              { label:'Posts',    val:myPosts.length, icon:'📸' },
              { label:'Vrienden', val:friendCnt,       icon:'👥' },
              { label:'Groepen',  val:groupCnt,        icon:'🏋️' },
            ].map(s => `
              <div class="flex flex-col items-center py-4 gap-0.5">
                <span class="text-[22px] font-black text-[#111827]">${s.val}</span>
                <span class="text-[11px] text-[#9CA3AF] font-semibold">${s.label}</span>
              </div>`).join('')}
          </div>

          <!-- Edit profile -->
          <button id="btn-edit" class="btn-secondary flex items-center justify-center gap-2 py-3">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Profiel bewerken
          </button>
        </div>

        <!-- Tabs -->
        <div class="tab-bar">
          <button class="tab-btn ${tab==='progress'?'active':''}" data-tab="progress">
            <div class="flex items-center justify-center gap-1.5">
              <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Progress
            </div>
          </button>
          <button class="tab-btn ${tab==='posts'?'active':''}" data-tab="posts">
            <div class="flex items-center justify-center gap-1.5">
              <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Posts
            </div>
          </button>
        </div>

        <!-- Tab content -->
        <div class="pt-3">

          ${tab === 'progress' ? `
          <!-- Progress photos tab -->
          <div class="px-4">
            <button id="btn-add-progress"
              class="w-full border-2 border-dashed border-[#E5E7EB] rounded-2xl py-4 mb-4
                flex items-center justify-center gap-2 text-[13px] font-semibold text-[#9CA3AF]
                hover:border-[#DC2626] hover:text-[#DC2626] transition-all active:scale-97">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/>
              </svg>
              Progress foto toevoegen
            </button>

            ${myProgress.length
              ? `<div class="grid grid-cols-2 gap-3">
                  ${myProgress.map(ph => `
                    <div class="progress-item" data-pid="${ph.id}">
                      <img src="${ph.image}" alt="${ph.note||'progress'}" loading="lazy">
                      <div class="overlay">
                        <div class="flex-1 min-w-0">
                          ${ph.note ? `<p class="text-[12px] font-bold text-white truncate">${ph.note}</p>` : ''}
                          <p class="text-[10px] text-[#D1D5DB] mt-0.5">${timeAgo(ph.createdAt)}</p>
                        </div>
                        <button class="del-progress flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all" data-id="${ph.id}">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>`
                  ).join('')}
                </div>`
              : `<div class="empty-state">
                  <div class="empty-icon">📷</div>
                  <p class="font-bold text-[#111827] text-[16px]">Nog geen progress foto's</p>
                  <p class="text-[#9CA3AF] text-sm">Leg je transformatie vast en kijk hoe ver je bent gekomen.</p>
                 </div>`
            }
          </div>
          ` : ''}

          ${tab === 'posts' ? `
          <!-- Posts grid tab -->
          ${myPosts.length
            ? `<div class="photo-grid">
                ${myPosts.map(p => `
                  <div class="photo-grid-item">
                    <img src="${p.image}" alt="post" loading="lazy">
                  </div>`).join('')}
               </div>`
            : `<div class="empty-state">
                <div class="empty-icon">🏋️</div>
                <p class="font-bold text-[#111827] text-[16px]">Nog geen posts</p>
                <p class="text-[#9CA3AF] text-sm">Deel je eerste gym-moment in de feed.</p>
               </div>`
          }` : ''}

        </div>
      </div>`;

    // Tab switch
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => { tab = btn.dataset.tab; render(); });
    });

    // Edit profile
    document.getElementById('btn-edit').addEventListener('click', () => {
      openModal(`
        <div class="px-5 pb-6">
          <div class="flex items-center justify-between pt-2 pb-5">
            <h2 class="text-[18px] font-black text-[#111827]">Profiel bewerken</h2>
            <button id="mc" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form id="edit-form" class="flex flex-col gap-4" novalidate>
            <div>
              <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Weergavenaam</label>
              <input id="e-name" type="text" value="${me.displayName}" class="rs-input" maxlength="40"/>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Bio <span class="normal-case text-[#9CA3AF] font-normal">(max 120 tekens)</span></label>
              <textarea id="e-bio" rows="2" class="rs-input" maxlength="120">${me.bio || ''}</textarea>
              <p class="text-[#9CA3AF] text-[11px] mt-1.5">Bijv. "Powerlifter 🏋️ | 3x per week | Bulk szn"</p>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Avatar URL <span class="normal-case text-[#9CA3AF] font-normal">(optioneel)</span></label>
              <input id="e-avatar" type="url" value="${me.avatar || ''}" class="rs-input" placeholder="https://…"/>
            </div>
            <button type="submit" class="btn-primary">Opslaan</button>
          </form>
        </div>
      `, content => {
        content.querySelector('#mc').addEventListener('click', closeModal);
        content.querySelector('#edit-form').addEventListener('submit', e => {
          e.preventDefault();
          const displayName = content.querySelector('#e-name').value.trim() || me.displayName;
          const bio         = content.querySelector('#e-bio').value.trim();
          const avatarUrl   = content.querySelector('#e-avatar').value.trim() || me.avatar;
          auth.updateProfile({ displayName, bio, avatar: avatarUrl });
          closeModal();
          showToast('Profiel opgeslagen ✓', 'success');
          render();
        });
      });
    });

    // Add progress photo
    document.getElementById('btn-add-progress')?.addEventListener('click', () => {
      openModal(`
        <div class="px-5 pb-6">
          <div class="flex items-center justify-between pt-2 pb-5">
            <h2 class="text-[18px] font-black text-[#111827]">Progress foto toevoegen</h2>
            <button id="mc" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form id="progress-form" class="flex flex-col gap-4" novalidate>
            <div>
              <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Afbeelding URL</label>
              <input id="pp-img" type="url" placeholder="https://…" class="rs-input" autocomplete="off"/>
            </div>
            <div id="pp-preview" class="hidden rounded-2xl overflow-hidden bg-[#F3F4F6]" style="aspect-ratio:2/3;max-height:280px;">
              <img id="pp-prev-img" class="w-full h-full object-cover" alt="preview">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Notitie</label>
              <input id="pp-note" type="text" placeholder="bijv. Week 8 — Bulk gestart 💪" class="rs-input" maxlength="60"/>
            </div>
            <div id="pp-err" class="hidden bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3"></div>
            <button type="submit" class="btn-primary">Toevoegen</button>
          </form>
        </div>
      `, content => {
        content.querySelector('#mc').addEventListener('click', closeModal);

        content.querySelector('#pp-img').addEventListener('input', e => {
          const url     = e.target.value.trim();
          const preview = content.querySelector('#pp-preview');
          const img     = content.querySelector('#pp-prev-img');
          if (url) { img.src = url; preview.classList.remove('hidden'); }
          else       preview.classList.add('hidden');
        });

        content.querySelector('#progress-form').addEventListener('submit', e => {
          e.preventDefault();
          const img  = content.querySelector('#pp-img').value.trim();
          const note = content.querySelector('#pp-note').value.trim();
          const err  = content.querySelector('#pp-err');
          if (!img) { err.textContent='Voeg een afbeelding URL toe.'; err.classList.remove('hidden'); return; }
          store.addProgressPhoto({ id:uid(), userId:me.id, image:img, note, createdAt:Date.now() });
          closeModal();
          showToast('Progress foto toegevoegd 📸', 'success');
          render();
        });
      });
    });

    // Delete progress photo
    container.querySelectorAll('.del-progress').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm('Progress foto verwijderen?')) return;
        store.deleteProgressPhoto(btn.dataset.id);
        showToast('Foto verwijderd', 'info');
        render();
      });
    });
  }

  render();
}
