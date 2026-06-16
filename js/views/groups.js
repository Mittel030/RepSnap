import { store }                                           from '../store.js';
import { openModal, closeModal, avatar, timeAgo, showToast } from '../main.js';

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// ── Group card with member avatars ───────────────────────────────────────────
function groupCard(group, members) {
  const memberUsers = members.slice(0,4).map(m => store.getUserById(m.userId)).filter(Boolean);
  return `
    <div class="group-card mx-4 mb-4" data-gid="${group.id}">
      <!-- Cover -->
      <div class="relative" style="height:130px;">
        ${group.cover
          ? `<img src="${group.cover}" alt="${group.name}" class="w-full h-full object-cover">`
          : `<div class="w-full h-full flex items-center justify-center" style="background:linear-gradient(135deg,#F3F4F6,#E5E7EB);">
               <span style="font-size:40px;">🏋️</span>
             </div>`
        }
        <div class="absolute inset-0" style="background:linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 55%)"></div>
        <div class="absolute bottom-3 left-4 right-4">
          <p class="font-black text-white text-[17px] leading-tight">${group.name}</p>
          <div class="flex items-center gap-2 mt-1">
            <div class="flex -space-x-2">
              ${memberUsers.slice(0,3).map(u =>
                `<div style="width:20px;height:20px;border-radius:50%;border:2px solid rgba(0,0,0,.4);overflow:hidden;flex-shrink:0;">
                  ${avatar(u, 20)}
                 </div>`
              ).join('')}
            </div>
            <span class="text-[12px] text-white/80 font-medium">${members.length} ${members.length===1?'lid':'leden'}</span>
          </div>
        </div>
      </div>
      <!-- Body -->
      <div class="px-4 py-3">
        ${group.description ? `<p class="text-[#6B7280] text-[13px] leading-relaxed line-clamp-2 mb-2">${group.description}</p>` : ''}
        <div class="flex items-center justify-between">
          <span class="text-[12px] text-[#9CA3AF]">Code: <span class="font-mono font-bold text-[#DC2626] tracking-wider">${group.code}</span></span>
          <span class="text-[11px] text-[#9CA3AF]">${timeAgo(group.createdAt)} geleden</span>
        </div>
      </div>
    </div>`;
}

// ── Group detail ──────────────────────────────────────────────────────────────
function groupDetail(container, group, currentUser, goBack) {
  const members = store.getGroupMembersOf(group.id);
  const posts   = store.getGroupPostsOf(group.id);
  const myRole  = members.find(m => m.userId === currentUser.id)?.role || 'member';
  const isAdmin = myRole === 'admin';

  container.innerHTML = `
    <div class="anim-fade pb-8" style="background:#F5F5F5;">

      <!-- Cover + back -->
      <div class="relative" style="height:200px;">
        ${group.cover
          ? `<img src="${group.cover}" alt="${group.name}" class="w-full h-full object-cover">`
          : `<div class="w-full h-full flex items-center justify-center" style="background:linear-gradient(135deg,#F3F4F6,#E5E7EB);">
               <span style="font-size:56px;">🏋️</span>
             </div>`
        }
        <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 60%)"></div>
        <button id="btn-back"
          class="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60 transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="absolute bottom-4 left-4 right-4">
          <p class="font-black text-white text-[22px] leading-tight">${group.name}</p>
          <p class="text-white/75 text-[13px] mt-1">
            ${members.length} leden · Code:
            <span class="font-mono font-bold text-[#FCA5A5] tracking-wider">${group.code}</span>
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-4 py-4 bg-white border-b border-[#F3F4F6]">
        ${group.description ? `<p class="text-[#6B7280] text-[14px] leading-relaxed mb-4">${group.description}</p>` : ''}
        <div class="flex gap-2 flex-wrap">
          <button id="btn-add-gpost" class="btn-sm brand flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
            Post toevoegen
          </button>
          <button id="btn-leave" class="btn-sm ${isAdmin ? 'danger' : 'ghost'}">
            ${isAdmin ? '🗑 Groep verwijderen' : 'Verlaten'}
          </button>
        </div>
      </div>

      <!-- Members -->
      <div class="px-4 py-4 bg-white border-b border-[#F3F4F6]">
        <p class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Leden (${members.length})</p>
        <div class="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          ${members.map(m => {
            const u = store.getUserById(m.userId);
            if (!u) return '';
            return `
              <div class="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-default">
                ${avatar(u, 46)}
                <span class="text-[10px] font-semibold text-[#9CA3AF] max-w-[52px] truncate">${u.username}</span>
                ${m.role === 'admin' ? `<span class="badge" style="font-size:9px;">admin</span>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Posts -->
      <div>
        <p class="px-4 pt-4 pb-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
          Posts (${posts.length})
        </p>
        ${posts.length
          ? posts.map(p => {
              const postAuthor = store.getUserById(p.userId);
              return `
                <div class="bg-white border-b border-[#F3F4F6]">
                  <div class="flex items-center gap-3 px-4 py-3">
                    ${avatar(postAuthor, 36)}
                    <div>
                      <p class="text-[14px] font-semibold text-[#111827]">${postAuthor?.displayName || 'Onbekend'}</p>
                      <p class="text-[12px] text-[#9CA3AF]">${timeAgo(p.createdAt)}</p>
                    </div>
                  </div>
                  <img src="${p.image}" alt="post" class="post-img" loading="lazy">
                  ${p.caption ? `<p class="px-4 py-3 text-[14px] text-[#374151] leading-snug">${p.caption}</p>` : ''}
                </div>`;
            }).join('')
          : `<div class="empty-state">
              <div class="empty-icon">📸</div>
              <p class="font-bold text-[#111827]">Geen posts</p>
              <p class="text-[#9CA3AF] text-sm">Wees de eerste om iets te posten!</p>
             </div>`
        }
      </div>
    </div>`;

  document.getElementById('btn-back').addEventListener('click', goBack);

  document.getElementById('btn-add-gpost').addEventListener('click', () => {
    openModal(`
      <div class="px-5 pb-6">
        <div class="flex items-center justify-between pt-2 pb-5">
          <h2 class="text-[18px] font-black text-[#111827]">Post in ${group.name}</h2>
          <button id="mc" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form id="gpost-form" class="flex flex-col gap-4" novalidate>
          <div>
            <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Afbeelding URL</label>
            <input id="gpost-img" type="url" placeholder="https://…" class="rs-input" autocomplete="off"/>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Caption</label>
            <textarea id="gpost-cap" rows="3" placeholder="Schrijf iets over de sessie…" class="rs-input"></textarea>
          </div>
          <div id="gpost-err" class="hidden bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3"></div>
          <button type="submit" class="btn-primary">Posten</button>
        </form>
      </div>
    `, content => {
      content.querySelector('#mc').addEventListener('click', closeModal);
      content.querySelector('#gpost-form').addEventListener('submit', e => {
        e.preventDefault();
        const img = content.querySelector('#gpost-img').value.trim();
        const cap = content.querySelector('#gpost-cap').value.trim();
        const err = content.querySelector('#gpost-err');
        if (!img) { err.textContent='Voeg een afbeelding URL toe.'; err.classList.remove('hidden'); return; }
        store.addGroupPost({ id:uid(), groupId:group.id, userId:currentUser.id, image:img, caption:cap, createdAt:Date.now() });
        closeModal();
        showToast('Post toegevoegd aan de groep 🔥', 'success');
        groupDetail(container, store.getGroupById(group.id), currentUser, goBack);
      });
    });
  });

  document.getElementById('btn-leave').addEventListener('click', () => {
    if (isAdmin) {
      if (!confirm(`Groep "${group.name}" permanent verwijderen? Dit is onomkeerbaar.`)) return;
      store.getGroupMembersOf(group.id).forEach(m => store.removeGroupMember(group.id, m.userId));
      store.deleteGroup(group.id);
      showToast('Groep verwijderd', 'info');
    } else {
      if (!confirm(`Groep "${group.name}" verlaten?`)) return;
      store.removeGroupMember(group.id, currentUser.id);
      showToast('Je hebt de groep verlaten', 'info');
    }
    goBack();
  });
}

// ── Main render ───────────────────────────────────────────────────────────────
export function renderGroups(container, currentUser) {
  function showList() {
    const myGroups = store.getMyGroups(currentUser.id);
    const other    = store.getGroups().filter(gr => !store.isGroupMember(gr.id, currentUser.id));

    container.innerHTML = `
      <div class="anim-fade py-4 pb-8" style="background:#F5F5F5;">

        ${myGroups.length
          ? `<p class="px-4 pb-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Mijn groepen</p>
             ${myGroups.map(gr => groupCard(gr, store.getGroupMembersOf(gr.id))).join('')}`
          : `<div class="empty-state">
              <div class="empty-icon">🏋️</div>
              <p class="font-bold text-[#111827] text-[17px]">Nog geen groepen</p>
              <p class="text-[#9CA3AF] text-sm">Maak een groep aan of join er een via een code.</p>
             </div>`
        }

        <!-- Join by code -->
        <div class="mx-4 mt-2 p-4 bg-white border border-[#E5E7EB] rounded-2xl" style="box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <p class="text-[14px] font-bold text-[#111827] mb-3">Groep joinen via code</p>
          <div class="flex gap-2">
            <input id="join-code" type="text" placeholder="bijv. IRON42"
              class="rs-input flex-1 font-mono uppercase tracking-widest"
              style="padding:11px 14px;font-size:15px;" maxlength="10"/>
            <button id="btn-join" class="btn-sm brand !rounded-xl px-5 !text-[14px]">Joinen</button>
          </div>
          <div id="join-err" class="hidden mt-2.5 text-red-600 text-[13px] font-medium"></div>
        </div>

        ${other.length ? `
        <p class="px-4 pt-6 pb-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Andere groepen</p>
        ${other.map(gr => groupCard(gr, store.getGroupMembersOf(gr.id))).join('')}` : ''}

      </div>`;

    container.querySelectorAll('.group-card').forEach(card => {
      card.addEventListener('click', () => {
        const group = store.getGroupById(card.dataset.gid);
        if (group) groupDetail(container, group, currentUser, showList);
      });
    });

    document.getElementById('btn-join').addEventListener('click', () => {
      const code  = document.getElementById('join-code').value.trim().toUpperCase();
      const errEl = document.getElementById('join-err');
      errEl.classList.add('hidden');
      if (!code) { errEl.textContent='Voer een code in.'; errEl.classList.remove('hidden'); return; }
      const group = store.getGroups().find(g => g.code === code);
      if (!group) { errEl.textContent=`Code "${code}" niet gevonden.`; errEl.classList.remove('hidden'); return; }
      if (store.isGroupMember(group.id, currentUser.id)) {
        errEl.textContent='Je bent al lid van deze groep.'; errEl.classList.remove('hidden'); return;
      }
      store.addGroupMember({ groupId:group.id, userId:currentUser.id, role:'member' });
      showToast(`Welkom in ${group.name}! 💪`, 'success');
      groupDetail(container, group, currentUser, showList);
    });
  }

  showList();
}

// ── Create group modal ────────────────────────────────────────────────────────
renderGroups.openCreate = function(currentUser) {
  openModal(`
    <div class="px-5 pb-6">
      <div class="flex items-center justify-between pt-2 pb-5">
        <h2 class="text-[18px] font-black text-[#111827]">Groep aanmaken</h2>
        <button id="mc" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <form id="create-form" class="flex flex-col gap-4" novalidate>
        <div>
          <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Groepsnaam</label>
          <input id="g-name" type="text" placeholder="bijv. Iron Brotherhood" class="rs-input" maxlength="40" autocomplete="off"/>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Beschrijving</label>
          <textarea id="g-desc" rows="2" placeholder="Waar is de groep voor?" class="rs-input"></textarea>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Cover afbeelding URL <span class="normal-case text-[#9CA3AF] font-normal">(optioneel)</span></label>
          <input id="g-cover" type="url" placeholder="https://…" class="rs-input" autocomplete="off"/>
        </div>
        <p class="text-[12px] text-[#9CA3AF]">
          Er wordt automatisch een unieke uitnodigingscode aangemaakt waarmee anderen kunnen joinen.
        </p>
        <div id="g-err" class="hidden bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3"></div>
        <button type="submit" class="btn-primary">Groep aanmaken</button>
      </form>
    </div>
  `, content => {
    content.querySelector('#mc').addEventListener('click', closeModal);
    content.querySelector('#create-form').addEventListener('submit', e => {
      e.preventDefault();
      const name  = content.querySelector('#g-name').value.trim();
      const desc  = content.querySelector('#g-desc').value.trim();
      const cover = content.querySelector('#g-cover').value.trim();
      const errEl = content.querySelector('#g-err');
      if (!name) { errEl.textContent='Voer een groepsnaam in.'; errEl.classList.remove('hidden'); return; }

      const code  = Math.random().toString(36).slice(2,8).toUpperCase();
      const group = { id:uid(), name, description:desc, cover, code, createdBy:currentUser.id, createdAt:Date.now() };
      store.addGroup(group);
      store.addGroupMember({ groupId:group.id, userId:currentUser.id, role:'admin' });
      closeModal();
      showToast(`Groep "${name}" aangemaakt! Code: ${code}`, 'success');

      const view = document.getElementById('view');
      renderGroups(view, currentUser);
    });
  });
};
