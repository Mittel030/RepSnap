import { api }                              from '../api.js';
import { avatar, showToast, showConfirm }  from '../main.js';

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export async function renderFriends(container, currentUser) {
    let query = '';
    let searchResults = [];
    let friendships   = [];
    let debounceTimer;

    async function load() {
        try { friendships = await api.getFriends(); }
        catch { friendships = []; }
        render();
    }

    function render() {
        const accepted = friendships.filter(f => f.status === 'accepted');
        const pending  = friendships.filter(f => f.status === 'pending' && f.from_user !== currentUser.id);
        const q        = query.trim().toLowerCase();

        container.innerHTML = `
          <div class="anim-fade pb-8" style="background:#F7F6F4;">

            <div class="p-4 bg-white sticky top-0 z-10" style="border-bottom:1px solid #EDEAE7;">
              <div class="search-wrap">
                <svg class="w-4 h-4 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input id="search-input" type="search" placeholder="Zoek gebruikers om toe te voegen…"
                  value="${esc(query)}" class="rs-input" autocomplete="off" autocapitalize="none" spellcheck="false"/>
              </div>
            </div>

            ${q.length >= 2 ? `
            <div class="inline-card mt-3 mx-4">
              <p class="section-label">Zoekresultaten</p>
              <div id="search-results">
                ${searchResults.length
                  ? searchResults.map(u => userRow(u, friendships, currentUser)).join('<hr class="rs-divider mx-4">')
                  : `<p class="text-center text-[#A8A29E] text-sm py-6">Geen resultaten voor "<strong>${esc(q)}</strong>"</p>`}
              </div>
            </div>` : ''}

            ${pending.length ? `
            <div class="inline-card mt-3 mx-4">
              <p class="section-label flex items-center gap-2">Openstaande verzoeken <span class="badge">${pending.length}</span></p>
              ${pending.map(f => `
                <div class="user-row">
                  ${avatar(f, 46)}
                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-semibold text-[#111827] truncate">${f.display_name}</p>
                    <p class="text-[12px] text-[#A8A29E]">@${f.username}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="btn-sm brand accept-req" data-id="${f.friendship_id}">Accepteren</button>
                    <button class="btn-sm ghost decline-req w-8 h-8 !p-0 flex items-center justify-center rounded-full" data-id="${f.friendship_id}">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>`).join('<hr class="rs-divider mx-4">')}
            </div>` : ''}

            <div class="inline-card mt-3 mx-4">
              <p class="section-label flex items-center gap-2">Vrienden ${accepted.length?`<span class="text-[#111827] font-bold normal-case text-[12px] tracking-normal">${accepted.length}</span>`:''}
              </p>
              ${accepted.length
                ? accepted.map((f, i) => `
                    ${i>0?'<hr class="rs-divider mx-4">':''}
                    <div class="user-row">
                      ${avatar(f, 46)}
                      <div class="flex-1 min-w-0">
                        <p class="text-[14px] font-semibold text-[#111827] truncate">${f.display_name}</p>
                        <p class="text-[12px] text-[#A8A29E] truncate">@${f.username}${f.bio?` · ${f.bio.slice(0,28)}`:''}</p>
                      </div>
                      <button class="btn-sm ghost remove-friend" data-id="${f.friendship_id}">Verwijderen</button>
                    </div>`).join('')
                : `<div class="empty-state" style="padding:40px 24px;"><div class="empty-icon">👥</div><p class="font-bold text-[16px] text-[#111827]">Nog geen vrienden</p><p class="text-[#A8A29E] text-sm">Zoek hierboven en stuur een verzoek.</p></div>`
              }
            </div>
          </div>`;

        const input = document.getElementById('search-input');
        input.addEventListener('input', e => {
            clearTimeout(debounceTimer);
            query = e.target.value;
            debounceTimer = setTimeout(async () => {
                if (query.trim().length >= 2) {
                    try { searchResults = await api.searchUsers(query.trim()); }
                    catch { searchResults = []; }
                } else { searchResults = []; }
                render();
            }, 250);
        });
        if (q.length >= 2) setTimeout(() => { input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); }, 0);

        container.querySelectorAll('.send-req').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await api.addFriend(btn.dataset.username);
                    showToast('Vriendschapsverzoek verstuurd 👋', 'success');
                    await load();
                } catch(e) { showToast(e.message, 'error'); }
            });
        });

        container.querySelectorAll('.accept-req').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await api.acceptFriend(btn.dataset.id);
                    showToast('Vriendschapsverzoek geaccepteerd 🤝', 'success');
                    const badge = document.getElementById('friends-badge');
                    await load();
                    badge?.classList.toggle('hidden', !friendships.some(f => f.status==='pending' && f.from_user !== currentUser.id));
                } catch(e) { showToast(e.message, 'error'); }
            });
        });

        container.querySelectorAll('.decline-req').forEach(btn => {
            btn.addEventListener('click', async () => {
                try { await api.removeFriend(btn.dataset.id); await load(); }
                catch(e) { showToast(e.message, 'error'); }
            });
        });

        container.querySelectorAll('.remove-friend').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ok = await showConfirm({ title: 'Vriend verwijderen?', body: 'Jullie posts verdwijnen uit elkaars feed.', confirm: 'Verwijderen' });
                if (!ok) return;
                try {
                    await api.removeFriend(btn.dataset.id);
                    showToast('Vriend verwijderd', 'info');
                    await load();
                } catch(e) { showToast(e.message, 'error'); }
            });
        });
    }

    await load();
}

function userRow(user, friendships, currentUser) {
    const fs  = friendships.find(f => f.id === user.id);
    const sent = friendships.find(f => f.from_user === currentUser.id && f.id === user.id && f.status === 'pending');
    const recv = friendships.find(f => f.to_user === currentUser.id && f.id === user.id && f.status === 'pending');
    const areFriends = friendships.some(f => f.id === user.id && f.status === 'accepted');

    let btn = '';
    if (areFriends) {
        btn = `<span class="btn-sm ghost flex items-center gap-1"><svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>Vrienden</span>`;
    } else if (sent) {
        btn = `<span class="text-[12px] font-semibold text-[#A8A29E] px-3 py-1.5 bg-[#F0EEEB] rounded-xl border border-[#E8E5E2]">Aangevraagd</span>`;
    } else if (recv) {
        btn = `<button class="btn-sm brand accept-req" data-id="${recv.friendship_id}">Accepteren</button>`;
    } else {
        btn = `<button class="btn-sm brand send-req" data-username="${user.username}">+ Toevoegen</button>`;
    }
    return `<div class="user-row">${avatar(user,46)}<div class="flex-1 min-w-0"><p class="text-[14px] font-semibold text-[#111827] truncate">${user.display_name}</p><p class="text-[12px] text-[#A8A29E] truncate">@${user.username}${user.bio?` · ${user.bio.slice(0,24)}`:''}</p></div>${btn}</div>`;
}
