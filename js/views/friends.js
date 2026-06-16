import { store }                                           from '../store.js';
import { avatar, showToast }                              from '../main.js';

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export function renderFriends(container, currentUser) {
  let query = '';
  let debounceTimer;

  function render() {
    const allUsers  = store.getUsers().filter(u => u.id !== currentUser.id);
    const friendIds = store.getFriendIds(currentUser.id);
    const pendingIn = store.getPendingRequests(currentUser.id);
    const friends   = friendIds.map(id => store.getUserById(id)).filter(Boolean);
    const q         = query.trim().toLowerCase();
    const hits      = q.length >= 2 ? allUsers.filter(u =>
      u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)) : [];

    container.innerHTML = `
      <div class="anim-fade pb-8" style="background:#F5F5F5;">

        <!-- Sticky search -->
        <div class="p-4 bg-white border-b border-[#F3F4F6] sticky top-0 z-10">
          <div class="search-wrap">
            <svg class="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input id="search-input" type="search" placeholder="Zoek naar gebruikers…"
              value="${escHtml(query)}" class="rs-input" autocomplete="off" autocapitalize="none" spellcheck="false"/>
          </div>
        </div>

        <!-- Search results -->
        ${q.length >= 2 ? `
        <div class="bg-white mt-3 mx-4 rounded-2xl border border-[#E5E7EB] overflow-hidden" style="box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <p class="section-label">Zoekresultaten</p>
          ${hits.length
            ? hits.map(u => userRow(u, currentUser, friendIds)).join('<hr class="rs-divider mx-4">')
            : `<p class="text-center text-[#9CA3AF] text-sm py-6">
                Geen resultaten voor "<strong class="text-[#6B7280]">${escHtml(q)}</strong>"
               </p>`
          }
        </div>` : ''}

        <!-- Pending requests -->
        ${pendingIn.length ? `
        <div class="bg-white mt-3 mx-4 rounded-2xl border border-[#E5E7EB] overflow-hidden" style="box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <p class="section-label flex items-center gap-2">
            Openstaande verzoeken
            <span class="badge">${pendingIn.length}</span>
          </p>
          ${pendingIn.map(req => {
            const sender = store.getUserById(req.from);
            if (!sender) return '';
            return `
              <div class="user-row">
                ${avatar(sender, 46)}
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-semibold text-[#111827] truncate">${sender.displayName}</p>
                  <p class="text-[12px] text-[#9CA3AF]">@${sender.username}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button class="btn-sm brand accept-req" data-id="${req.id}">Accepteren</button>
                  <button class="btn-sm ghost decline-req w-8 h-8 !p-0 flex items-center justify-center rounded-full" data-id="${req.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>`;
          }).join('<hr class="rs-divider mx-4">')}
        </div>` : ''}

        <!-- Friends list -->
        <div class="bg-white mt-3 mx-4 rounded-2xl border border-[#E5E7EB] overflow-hidden" style="box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <p class="section-label flex items-center gap-2">
            Vrienden
            ${friends.length ? `<span class="text-[#111827] font-bold normal-case text-[12px] tracking-normal">${friends.length}</span>` : ''}
          </p>
          ${friends.length
            ? friends.map((u, i) => `
                ${i > 0 ? '<hr class="rs-divider mx-4">' : ''}
                <div class="user-row">
                  ${avatar(u, 46)}
                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-semibold text-[#111827] truncate">${u.displayName}</p>
                    <p class="text-[12px] text-[#9CA3AF] truncate">@${u.username}${u.bio ? ` · ${u.bio.slice(0,28)}` : ''}</p>
                  </div>
                  <button class="btn-sm ghost remove-friend" data-id="${u.id}">Verwijderen</button>
                </div>`).join('')
            : `<div class="empty-state" style="padding:40px 24px;">
                <div class="empty-icon">👥</div>
                <p class="font-bold text-[16px] text-[#111827]">Nog geen vrienden</p>
                <p class="text-[#9CA3AF] text-sm">Zoek hierboven en stuur een verzoek.</p>
               </div>`
          }
        </div>

      </div>`;

    const input = document.getElementById('search-input');
    input.addEventListener('input', e => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { query = e.target.value; render(); }, 200);
    });
    if (q.length >= 2) {
      setTimeout(() => { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 0);
    }

    container.querySelectorAll('.send-req').forEach(btn => {
      btn.addEventListener('click', () => {
        store.addFriendship({ id:uid(), from:currentUser.id, to:btn.dataset.uid, status:'pending' });
        showToast('Vriendschapsverzoek verstuurd 👋', 'success');
        render();
      });
    });

    container.querySelectorAll('.accept-req').forEach(btn => {
      btn.addEventListener('click', () => {
        store.updateFriendship(btn.dataset.id, { status:'accepted' });
        showToast('Vriendschapsverzoek geaccepteerd 🤝', 'success');
        const badge = document.getElementById('friends-badge');
        if (badge) badge.classList.toggle('hidden', store.getPendingRequests(currentUser.id).length === 0);
        render();
      });
    });

    container.querySelectorAll('.decline-req').forEach(btn => {
      btn.addEventListener('click', () => { store.removeFriendship(btn.dataset.id); render(); });
    });

    container.querySelectorAll('.remove-friend').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Vriend verwijderen?')) return;
        const fs = store.getFriendship(currentUser.id, btn.dataset.id);
        if (fs) store.removeFriendship(fs.id);
        showToast('Vriend verwijderd', 'info');
        render();
      });
    });
  }

  render();
}

function userRow(user, currentUser, friendIds) {
  const fs = store.getFriendship(currentUser.id, user.id);
  let btn  = '';
  if (friendIds.includes(user.id)) {
    btn = `<button class="btn-sm ghost remove-friend flex items-center gap-1" data-id="${user.id}">
             <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
             </svg>Vrienden</button>`;
  } else if (fs?.status === 'pending' && fs.from === currentUser.id) {
    btn = `<span class="text-[12px] font-semibold text-[#9CA3AF] px-3 py-1.5 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB]">Aangevraagd</span>`;
  } else if (fs?.status === 'pending' && fs.to === currentUser.id) {
    btn = `<button class="btn-sm brand accept-req" data-id="${fs.id}">Accepteren</button>`;
  } else {
    btn = `<button class="btn-sm brand send-req" data-uid="${user.id}">+ Toevoegen</button>`;
  }
  return `
    <div class="user-row">
      ${avatar(user, 46)}
      <div class="flex-1 min-w-0">
        <p class="text-[14px] font-semibold text-[#111827] truncate">${user.displayName}</p>
        <p class="text-[12px] text-[#9CA3AF] truncate">@${user.username}${user.bio?` · ${user.bio.slice(0,24)}`:''}</p>
      </div>
      ${btn}
    </div>`;
}
